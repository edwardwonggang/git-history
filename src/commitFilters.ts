import { CommitInfo } from './types';

export function shouldHideMergeCommit(commit: CommitInfo): boolean {
  return commit.parents.length > 1 || isGerritMergeWrapperSubject(commit.subject);
}

export function isGerritMergeWrapperSubject(subject: string): boolean {
  return /^Merge\s+".+"\s+into\s+\S+/.test(subject.trim());
}
