import * as vscode from 'vscode';
import { HistoryProvider } from '../historyProvider';
import { ChangedFile, CommitInfo, HistoryTarget } from '../types';

export type HistoryTreeItem = CommitTreeItem | ChangedFileTreeItem | MessageTreeItem;

export class HistoryTreeProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<HistoryTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private target: HistoryTarget | undefined;
  private commits: readonly CommitInfo[] = [];
  private provider: HistoryProvider | undefined;
  private readonly changedFilesByCommit = new Map<string, Promise<readonly ChangedFile[]>>();
  private errorMessage: string | undefined;
  private loading = false;

  get currentTarget(): HistoryTarget | undefined {
    return this.target;
  }

  get currentProvider(): HistoryProvider | undefined {
    return this.provider;
  }

  setLoading(target: HistoryTarget): void {
    this.target = target;
    this.commits = [];
    this.provider = undefined;
    this.errorMessage = undefined;
    this.loading = true;
    this.changedFilesByCommit.clear();
    this.refresh();
  }

  setHistory(target: HistoryTarget, commits: readonly CommitInfo[], provider: HistoryProvider): void {
    this.target = target;
    this.commits = commits;
    this.provider = provider;
    this.errorMessage = undefined;
    this.loading = false;
    this.changedFilesByCommit.clear();
    this.refresh();
  }

  setError(message: string): void {
    this.errorMessage = message;
    this.loading = false;
    this.refresh();
  }

  refresh(item?: HistoryTreeItem): void {
    this.onDidChangeTreeDataEmitter.fire(item);
  }

  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: HistoryTreeItem): Promise<HistoryTreeItem[]> {
    if (element instanceof CommitTreeItem) {
      return this.getChangedFileItems(element);
    }

    if (element) {
      return [];
    }

    if (this.loading) {
      return [new MessageTreeItem('Loading history...', 'sync~spin')];
    }

    if (this.errorMessage) {
      return [new MessageTreeItem(this.errorMessage, 'error')];
    }

    if (!this.target) {
      return [new MessageTreeItem('Right-click a file or folder and choose Show Merged Gerrit History.', 'info')];
    }

    if (this.commits.length === 0) {
      return [new MessageTreeItem(`No merged commits found for ${this.target.displayPath}.`, 'info')];
    }

    return this.commits.map(commit => new CommitTreeItem(commit));
  }

  private async getChangedFileItems(commitItem: CommitTreeItem): Promise<HistoryTreeItem[]> {
    if (!this.provider || !this.target) {
      return [new MessageTreeItem('History provider is not ready.', 'error')];
    }

    try {
      let filesPromise = this.changedFilesByCommit.get(commitItem.commit.hash);
      if (!filesPromise) {
        filesPromise = this.provider.getChangedFiles(commitItem.commit, this.target);
        this.changedFilesByCommit.set(commitItem.commit.hash, filesPromise);
      }

      const files = await filesPromise;
      if (files.length === 0) {
        return [new MessageTreeItem('No changed files found for this path.', 'info')];
      }

      return files.map(file => new ChangedFileTreeItem(commitItem.commit, file));
    } catch (error) {
      return [new MessageTreeItem(toErrorMessage(error), 'error')];
    }
  }
}

export class CommitTreeItem extends vscode.TreeItem {
  readonly contextValue = 'gerritHistory.commit';

  constructor(readonly commit: CommitInfo) {
    super(commitLabel(commit), vscode.TreeItemCollapsibleState.Collapsed);
    this.description = commit.subject;
    this.tooltip = [
      commit.hash,
      commit.subject,
      `${commit.authorName} <${commit.authorEmail}>`,
      commit.authorDate
    ].join('\n');
    this.iconPath = new vscode.ThemeIcon('git-commit');
  }
}

export class ChangedFileTreeItem extends vscode.TreeItem {
  readonly contextValue = 'gerritHistory.changedFile';

  constructor(
    readonly commit: CommitInfo,
    readonly changedFile: ChangedFile
  ) {
    super(`${changedFile.status} ${changedFile.path}`, vscode.TreeItemCollapsibleState.None);
    this.description = changedFile.oldPath && changedFile.oldPath !== changedFile.path ? `from ${changedFile.oldPath}` : undefined;
    this.tooltip = changedFile.oldPath && changedFile.oldPath !== changedFile.path
      ? `${changedFile.status} ${changedFile.oldPath} -> ${changedFile.path}`
      : `${changedFile.status} ${changedFile.path}`;
    this.iconPath = iconForStatus(changedFile.status);
    this.command = {
      command: 'gerritHistory.openDiff',
      title: 'Open Diff',
      arguments: [this]
    };
  }
}

export class MessageTreeItem extends vscode.TreeItem {
  constructor(message: string, icon: string) {
    super(message, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

function commitLabel(commit: CommitInfo): string {
  const shortHash = commit.hash.slice(0, 8);
  const date = formatDate(commit.authorDate);
  return `${shortHash}  ${date}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function iconForStatus(status: string): vscode.ThemeIcon {
  switch (status) {
    case 'A':
      return new vscode.ThemeIcon('diff-added');
    case 'D':
      return new vscode.ThemeIcon('diff-removed');
    case 'R':
      return new vscode.ThemeIcon('diff-renamed');
    default:
      return new vscode.ThemeIcon('diff-modified');
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
