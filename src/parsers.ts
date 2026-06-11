import { ChangedFile, ChangeStatus, CommitInfo } from './types';

const RECORD_SEPARATOR = '\x1e';
const FIELD_SEPARATOR = '\x1f';

export function parseGitLog(output: string): CommitInfo[] {
  return output
    .split(RECORD_SEPARATOR)
    .map(record => record.trim())
    .filter(Boolean)
    .map(parseGitLogRecord);
}

function parseGitLogRecord(record: string): CommitInfo {
  const [hash = '', parents = '', authorName = '', authorEmail = '', authorDate = '', subject = ''] = record.split(FIELD_SEPARATOR);
  return {
    hash,
    parents: parents.trim() ? parents.trim().split(/\s+/) : [],
    authorName,
    authorEmail,
    authorDate,
    subject
  };
}

export function parseDiffTreeNameStatus(output: string): ChangedFile[] {
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(parseNameStatusLine);
}

function parseNameStatusLine(line: string): ChangedFile {
  const parts = line.split('\t');
  const rawStatus = parts[0] ?? '';
  const status = rawStatus.charAt(0) as ChangeStatus;
  const score = rawStatus.length > 1 ? rawStatus.slice(1) : undefined;

  if ((status === 'R' || status === 'C') && parts.length >= 3) {
    return {
      status,
      score,
      oldPath: parts[1],
      path: parts[2]
    };
  }

  return {
    status,
    score,
    path: parts[1] ?? ''
  };
}
