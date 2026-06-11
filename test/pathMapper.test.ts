import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toGitRelativePath } from '../src/pathUtils';

describe('toGitRelativePath', () => {
  it('normalizes Windows-style separators to Git path separators', () => {
    assert.equal(toGitRelativePath('src\\module\\file.cpp'), 'src/module/file.cpp');
  });

  it('keeps POSIX-style paths stable', () => {
    assert.equal(toGitRelativePath('src/module/file.cpp'), 'src/module/file.cpp');
  });
});
