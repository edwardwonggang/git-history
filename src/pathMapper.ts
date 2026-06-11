import * as path from 'path';
import * as vscode from 'vscode';
import { HistoryTarget } from './types';
import { toGitRelativePath } from './pathUtils';

export class PathMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathMappingError';
  }
}

export function createHistoryTarget(uri?: vscode.Uri): HistoryTarget {
  const selectedUri = uri ?? vscode.window.activeTextEditor?.document.uri;
  if (!selectedUri) {
    throw new PathMappingError('Select a file or folder inside the workspace first.');
  }
  if (selectedUri.scheme !== 'file') {
    throw new PathMappingError('Only file-system paths are supported.');
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(selectedUri);
  if (!workspaceFolder) {
    throw new PathMappingError('The selected path is not inside an open workspace folder.');
  }

  const workspaceRoot = normalizeFsPath(workspaceFolder.uri.fsPath);
  const selectedFsPath = normalizeFsPath(selectedUri.fsPath);
  const relative = path.relative(workspaceRoot, selectedFsPath);

  if (!relative || relative === '') {
    return {
      workspaceRoot,
      selectedFsPath,
      relativePath: '.',
      displayPath: '.'
    };
  }

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new PathMappingError('The selected path is outside the workspace root.');
  }

  const relativePath = toGitRelativePath(relative);
  return {
    workspaceRoot,
    selectedFsPath,
    relativePath,
    displayPath: relativePath
  };
}

function normalizeFsPath(fsPath: string): string {
  return path.resolve(fsPath);
}
