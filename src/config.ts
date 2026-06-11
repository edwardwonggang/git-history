import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function loadConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('gerritHistory');

  const sshHost = readString(config, 'sshHost');
  const sshUser = readString(config, 'sshUser');
  const linuxRepoPath = readString(config, 'linuxRepoPath');
  const sshPort = readNumber(config, 'sshPort', 22);
  const defaultLimit = readNumber(config, 'defaultLimit', 1000);
  const historyMonths = readNumber(config, 'historyMonths', 3);
  const includeMergeCommits = readBoolean(config, 'includeMergeCommits', false);
  const gitRef = readString(config, 'gitRef') || 'HEAD';
  const commandTimeoutMs = readNumber(config, 'commandTimeoutMs', 30000);

  const missing: string[] = [];
  if (!sshHost) {
    missing.push('gerritHistory.sshHost');
  }
  if (!sshUser) {
    missing.push('gerritHistory.sshUser');
  }
  if (!linuxRepoPath) {
    missing.push('gerritHistory.linuxRepoPath');
  }

  if (missing.length > 0) {
    throw new ConfigError(`Missing required setting: ${missing.join(', ')}`);
  }
  if (!Number.isInteger(sshPort) || sshPort < 1 || sshPort > 65535) {
    throw new ConfigError('gerritHistory.sshPort must be between 1 and 65535.');
  }
  if (!Number.isInteger(defaultLimit) || defaultLimit < 1) {
    throw new ConfigError('gerritHistory.defaultLimit must be a positive integer.');
  }
  if (!Number.isInteger(historyMonths) || historyMonths < 1) {
    throw new ConfigError('gerritHistory.historyMonths must be a positive integer.');
  }
  if (!Number.isInteger(commandTimeoutMs) || commandTimeoutMs < 1000) {
    throw new ConfigError('gerritHistory.commandTimeoutMs must be at least 1000.');
  }

  return {
    sshHost,
    sshUser,
    sshPort,
    linuxRepoPath,
    defaultLimit,
    historyMonths,
    includeMergeCommits,
    gitRef,
    commandTimeoutMs
  };
}

function readString(config: vscode.WorkspaceConfiguration, key: string): string {
  const value = config.get<unknown>(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(config: vscode.WorkspaceConfiguration, key: string, fallback: number): number {
  const value = config.get<unknown>(key);
  return typeof value === 'number' ? value : fallback;
}

function readBoolean(config: vscode.WorkspaceConfiguration, key: string, fallback: boolean): boolean {
  const value = config.get<unknown>(key);
  return typeof value === 'boolean' ? value : fallback;
}
