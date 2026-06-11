export interface ExtensionConfig {
  readonly sshHost: string;
  readonly sshUser: string;
  readonly sshPort: number;
  readonly linuxRepoPath: string;
  readonly defaultLimit: number;
  readonly historyMonths: number;
  readonly includeMergeCommits: boolean;
  readonly gitRef: string;
  readonly commandTimeoutMs: number;
  readonly authorFilter: string[];
}

export interface HistoryTarget {
  readonly workspaceRoot: string;
  readonly selectedFsPath: string;
  readonly relativePath: string;
  readonly displayPath: string;
}

export interface CommitInfo {
  readonly hash: string;
  readonly parents: readonly string[];
  readonly authorName: string;
  readonly authorEmail: string;
  readonly authorDate: string;
  readonly subject: string;
}

export type ChangeStatus = 'A' | 'M' | 'D' | 'R' | 'C' | 'T' | 'U' | 'X' | 'B';

export interface ChangedFile {
  readonly status: ChangeStatus;
  readonly path: string;
  readonly oldPath?: string;
  readonly score?: string;
}

export type DiffSide = 'before' | 'after';

export interface DiffRequest {
  readonly commitHash: string;
  readonly filePath: string;
  readonly oldPath?: string;
  readonly status: ChangeStatus;
  readonly side: DiffSide;
  readonly parentHash?: string;
}
