import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isGerritMergeWrapperSubject, shouldHideMergeCommit } from '../src/commitFilters';
import { CommitInfo } from '../src/types';

describe('isGerritMergeWrapperSubject', () => {
  it('matches Gerrit submit merge wrapper subjects', () => {
    assert.equal(isGerritMergeWrapperSubject('Merge "RDC:SF01-972652:CAN2.0协议支持" into Feature_BCUA'), true);
  });

  it('does not match normal change subjects', () => {
    assert.equal(isGerritMergeWrapperSubject('RDC:SF01-972652:CAN2.0协议支持'), false);
  });
});

describe('shouldHideMergeCommit', () => {
  it('hides multi-parent commits', () => {
    assert.equal(shouldHideMergeCommit(commit(['a', 'b'], 'Regular subject')), true);
  });

  it('hides Gerrit merge wrapper subjects', () => {
    assert.equal(shouldHideMergeCommit(commit(['a'], 'Merge "change" into Feature_BCUA')), true);
  });

  it('keeps normal single-parent commits', () => {
    assert.equal(shouldHideMergeCommit(commit(['a'], 'RDC: normal subject')), false);
  });
});

function commit(parents: string[], subject: string): CommitInfo {
  return {
    hash: 'abc123',
    parents,
    authorName: 'Alice',
    authorEmail: 'alice@example.com',
    authorDate: '2026-01-01T00:00:00.000Z',
    subject
  };
}
