import { ChangedFile, CommitInfo, DiffRequest, HistoryTarget } from './types';
import { SshGitClient } from './sshGitClient';

export class HistoryProvider {
  constructor(private readonly client: SshGitClient) {}

  getCommits(target: HistoryTarget): Promise<CommitInfo[]> {
    return this.client.getHistory(target.relativePath);
  }

  getChangedFiles(commit: CommitInfo, target: HistoryTarget): Promise<ChangedFile[]> {
    return this.client.getChangedFiles(commit.hash, target.relativePath, commit.parents[0]);
  }

  getFileContent(request: DiffRequest): Promise<string> {
    return this.client.getFileContent(request);
  }
}
