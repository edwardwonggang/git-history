import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { HistoryProvider } from './historyProvider';
import { DiffRequest } from './types';

interface RegisteredDiffRequest {
  readonly provider: HistoryProvider;
  readonly request: DiffRequest;
}

export class DiffContentProvider implements vscode.TextDocumentContentProvider {
  private readonly requests = new Map<string, RegisteredDiffRequest>();
  private readonly contentCache = new Map<string, string>();

  register(provider: HistoryProvider, request: DiffRequest): vscode.Uri {
    const id = crypto.randomUUID();
    this.requests.set(id, { provider, request });

    return vscode.Uri.from({
      scheme: request.side === 'before' ? 'gerrit-history-before' : 'gerrit-history-after',
      path: `/${request.filePath}`,
      query: id
    });
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const id = uri.query;
    const registered = this.requests.get(id);
    if (!registered) {
      return '';
    }

    const key = cacheKey(registered.request);
    const cached = this.contentCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const content = await registered.provider.getFileContent(registered.request);
    this.contentCache.set(key, content);
    return content;
  }
}

function cacheKey(request: DiffRequest): string {
  return [
    request.side,
    request.commitHash,
    request.parentHash ?? '',
    request.status,
    request.oldPath ?? '',
    request.filePath
  ].join('\x1f');
}
