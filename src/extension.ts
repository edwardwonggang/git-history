import * as vscode from 'vscode';
import { loadConfig } from './config';
import { DiffContentProvider } from './diffContentProvider';
import { HistoryProvider } from './historyProvider';
import { createHistoryTarget } from './pathMapper';
import { SshGitClient } from './sshGitClient';
import { ChangedFileTreeItem, CommitTreeItem, HistoryTreeProvider } from './views/historyTreeProvider';
import { HistoryTarget } from './types';

const STORAGE_KEY_LAST_TARGET = 'gerritHistory.lastTarget';

export function activate(context: vscode.ExtensionContext): void {
  const treeProvider = new HistoryTreeProvider();
  const treeView = vscode.window.createTreeView('gerritHistory.historyView', {
    treeDataProvider: treeProvider,
    showCollapseAll: true
  });

  const diffProvider = new DiffContentProvider();

  context.subscriptions.push(
    treeView,
    vscode.workspace.registerTextDocumentContentProvider('gerrit-history-before', diffProvider),
    vscode.workspace.registerTextDocumentContentProvider('gerrit-history-after', diffProvider),
    vscode.commands.registerCommand('gerritHistory.showHistory', (uri?: vscode.Uri) => showHistory(uri, treeProvider, treeView, context)),
    vscode.commands.registerCommand('gerritHistory.refresh', () => refreshHistory(treeProvider, treeView, context)),
    vscode.commands.registerCommand('gerritHistory.openDiff', (item?: ChangedFileTreeItem) => openDiff(item, treeProvider, diffProvider)),
    vscode.commands.registerCommand('gerritHistory.copyCommitHash', (item?: CommitTreeItem) => copyCommitHash(item))
  );

  restoreLastTarget(context, treeProvider, treeView);
}

export function deactivate(): void {}

async function restoreLastTarget(
  context: vscode.ExtensionContext,
  treeProvider: HistoryTreeProvider,
  treeView: vscode.TreeView<unknown>
): Promise<void> {
  const saved = context.globalState.get<HistoryTarget>(STORAGE_KEY_LAST_TARGET);
  if (!saved) {
    return;
  }

  try {
    const target = createHistoryTarget(vscode.Uri.file(saved.selectedFsPath));
    await loadHistoryForTarget(target, treeProvider, treeView, context);
  } catch {
    context.globalState.update(STORAGE_KEY_LAST_TARGET, undefined);
  }
}

async function showHistory(
  uri: vscode.Uri | undefined,
  treeProvider: HistoryTreeProvider,
  treeView: vscode.TreeView<unknown>,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const target = createHistoryTarget(uri);
    await loadHistoryForTarget(target, treeProvider, treeView, context);
  } catch (error) {
    showError(error);
  }
}

async function refreshHistory(
  treeProvider: HistoryTreeProvider,
  treeView: vscode.TreeView<unknown>,
  context: vscode.ExtensionContext
): Promise<void> {
  const target = treeProvider.currentTarget;
  if (!target) {
    vscode.window.showInformationMessage('Right-click a file or folder and choose Show Merged Gerrit History first.');
    return;
  }

  await loadHistoryForTarget(target, treeProvider, treeView, context);
}

async function loadHistoryForTarget(
  target: ReturnType<typeof createHistoryTarget>,
  treeProvider: HistoryTreeProvider,
  treeView: vscode.TreeView<unknown>,
  context: vscode.ExtensionContext
): Promise<void> {
  const config = loadConfig();
  const provider = new HistoryProvider(new SshGitClient(config));

  treeProvider.setLoading(target);
  treeView.message = `Loading ${target.displayPath}`;

  try {
    const commits = await vscode.window.withProgress({
      location: vscode.ProgressLocation.Window,
      title: `Loading merged history for ${target.displayPath}`
    }, () => provider.getCommits(target));

    treeProvider.setHistory(target, commits, provider);
    treeView.message = commits.length > 0 ? target.displayPath : `No history: ${target.displayPath}`;
    context.globalState.update(STORAGE_KEY_LAST_TARGET, target);
  } catch (error) {
    const message = toErrorMessage(error);
    treeProvider.setError(message);
    treeView.message = target.displayPath;
    showError(error);
  }
}

async function openDiff(
  item: ChangedFileTreeItem | undefined,
  treeProvider: HistoryTreeProvider,
  diffProvider: DiffContentProvider
): Promise<void> {
  if (!(item instanceof ChangedFileTreeItem)) {
    vscode.window.showInformationMessage('Select a changed file from Gerrit History first.');
    return;
  }

  const provider = treeProvider.currentProvider;
  if (!provider) {
    vscode.window.showErrorMessage('History provider is not ready.');
    return;
  }

  const parentHash = item.commit.parents[0];
  const beforeUri = diffProvider.register(provider, {
    commitHash: item.commit.hash,
    parentHash,
    filePath: item.changedFile.path,
    oldPath: item.changedFile.oldPath,
    status: item.changedFile.status,
    side: 'before'
  });
  const afterUri = diffProvider.register(provider, {
    commitHash: item.commit.hash,
    parentHash,
    filePath: item.changedFile.path,
    oldPath: item.changedFile.oldPath,
    status: item.changedFile.status,
    side: 'after'
  });

  const title = `${basename(item.changedFile.path)}: ${item.commit.hash.slice(0, 8)} before <-> after`;
  await vscode.commands.executeCommand('vscode.diff', beforeUri, afterUri, title);
}

async function copyCommitHash(item: CommitTreeItem | undefined): Promise<void> {
  if (!(item instanceof CommitTreeItem)) {
    vscode.window.showInformationMessage('Select a commit from Gerrit History first.');
    return;
  }

  await vscode.env.clipboard.writeText(item.commit.hash);
  vscode.window.showInformationMessage(`Copied ${item.commit.hash.slice(0, 8)}.`);
}

function basename(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

function showError(error: unknown): void {
  vscode.window.showErrorMessage(toErrorMessage(error));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
