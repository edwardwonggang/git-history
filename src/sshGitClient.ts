import { execFile } from 'child_process';
import { ExtensionConfig, ChangedFile, CommitInfo, DiffRequest } from './types';
import { parseDiffTreeNameStatus, parseGitLog } from './parsers';
import { quoteRemoteArg, quoteRemoteArgs } from './shellQuote';
import { monthsAgoIso } from './dateRange';
import { shouldHideMergeCommit } from './commitFilters';

export class RemoteCommandError extends Error {
  constructor(
    message: string,
    readonly stderr?: string,
    readonly code?: number | string | null
  ) {
    super(message);
    this.name = 'RemoteCommandError';
  }
}

export class SshGitClient {
  constructor(private readonly config: ExtensionConfig) {}

  async getHistory(relativePath: string): Promise<CommitInfo[]> {
    const format = '%H%x1f%P%x1f%an%x1f%ae%x1f%ad%x1f%s%x1e';
    const args = [
      'git',
      'log',
      '--date=iso-strict',
      `--since=${monthsAgoIso(this.config.historyMonths)}`,
      `--format=${format}`,
      '-n',
      String(this.config.defaultLimit),
      this.config.gitRef,
      '--',
      relativePath
    ];
    if (!this.config.includeMergeCommits) {
      args.splice(2, 0, '--no-merges');
    }

    const output = await this.runGit(args);
    const commits = parseGitLog(output);
    return this.config.includeMergeCommits ? commits : commits.filter(commit => !shouldHideMergeCommit(commit));
  }

  async getChangedFiles(commitHash: string, relativePath: string, parentHash?: string): Promise<ChangedFile[]> {
    const args = parentHash
      ? [
          'git',
          'diff',
          '--name-status',
          '--find-renames',
          parentHash,
          commitHash,
          '--',
          relativePath
        ]
      : [
          'git',
          'diff-tree',
          '--root',
          '--no-commit-id',
          '--name-status',
          '-r',
          commitHash,
          '--',
          relativePath
        ];

    const output = await this.runGit(args);
    return parseDiffTreeNameStatus(output).filter(file => Boolean(file.path));
  }

  async getFileContent(request: DiffRequest): Promise<string> {
    if (request.side === 'before' && request.status === 'A') {
      return '';
    }
    if (request.side === 'after' && request.status === 'D') {
      return '';
    }

    const filePath = request.side === 'before' ? request.oldPath ?? request.filePath : request.filePath;
    const rev = request.side === 'before'
      ? `${request.parentHash ?? `${request.commitHash}^1`}:${filePath}`
      : `${request.commitHash}:${filePath}`;

    try {
      return await this.runGit(['git', 'show', rev]);
    } catch (error) {
      if (error instanceof RemoteCommandError && request.side === 'before') {
        return '';
      }
      throw error;
    }
  }

  private async runGit(args: readonly string[]): Promise<string> {
    return this.runRemote(buildRemoteGitCommand(this.config.linuxRepoPath, args));
  }

  private runRemote(command: string): Promise<string> {
    const sshTarget = `${this.config.sshUser}@${this.config.sshHost}`;
    const sshArgs = [
      '-p',
      String(this.config.sshPort),
      sshTarget,
      command
    ];

    return new Promise((resolve, reject) => {
      execFile('ssh', sshArgs, {
        timeout: this.config.commandTimeoutMs,
        maxBuffer: 20 * 1024 * 1024,
        windowsHide: true
      }, (error, stdout, stderr) => {
        if (error) {
          const code = typeof error === 'object' && 'code' in error ? error.code as number | string | null : null;
          reject(new RemoteCommandError(formatRemoteError(error.message, stderr), stderr, code));
          return;
        }
        resolve(stdout);
      });
    });
  }
}

export function buildRemoteGitCommand(linuxRepoPath: string, args: readonly string[]): string {
  return `cd ${quoteRemoteArg(linuxRepoPath)} && ${quoteRemoteArgs(args)}`;
}

function formatRemoteError(message: string, stderr: string): string {
  const detail = stderr.trim();
  return detail ? `${message}: ${detail}` : message;
}
