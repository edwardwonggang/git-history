import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDiffTreeNameStatus, parseGitLog } from '../src/parsers';

describe('parseGitLog', () => {
  it('parses machine-separated git log records', () => {
    const output = [
      'abc123\x1fparent1 parent2\x1fAlice\x1falice@example.com\x1f2026-01-02T03:04:05+08:00\x1fFix parser\x1e',
      'def456\x1f\x1fBob\x1fbob@example.com\x1f2026-01-03T03:04:05+08:00\x1fInitial import\x1e'
    ].join('');

    assert.deepEqual(parseGitLog(output), [
      {
        hash: 'abc123',
        parents: ['parent1', 'parent2'],
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        authorDate: '2026-01-02T03:04:05+08:00',
        subject: 'Fix parser'
      },
      {
        hash: 'def456',
        parents: [],
        authorName: 'Bob',
        authorEmail: 'bob@example.com',
        authorDate: '2026-01-03T03:04:05+08:00',
        subject: 'Initial import'
      }
    ]);
  });
});

describe('parseDiffTreeNameStatus', () => {
  it('parses added, modified, deleted, renamed, and copied files', () => {
    const output = [
      'A\tsrc/new.cpp',
      'M\tsrc/existing.cpp',
      'D\tsrc/deleted.cpp',
      'R089\tsrc/old.cpp\tsrc/renamed.cpp',
      'C100\tsrc/source.cpp\tsrc/copied.cpp'
    ].join('\n');

    assert.deepEqual(parseDiffTreeNameStatus(output), [
      { status: 'A', score: undefined, path: 'src/new.cpp' },
      { status: 'M', score: undefined, path: 'src/existing.cpp' },
      { status: 'D', score: undefined, path: 'src/deleted.cpp' },
      { status: 'R', score: '089', oldPath: 'src/old.cpp', path: 'src/renamed.cpp' },
      { status: 'C', score: '100', oldPath: 'src/source.cpp', path: 'src/copied.cpp' }
    ]);
  });
});
