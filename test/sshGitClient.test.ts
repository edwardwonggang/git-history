import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRemoteGitCommand } from '../src/sshGitClient';

describe('buildRemoteGitCommand', () => {
  it('quotes repository path and git arguments', () => {
    const command = buildRemoteGitCommand('/work/repo path', ['git', 'log', '--', "src/a'b.cpp"]);
    assert.equal(command, "cd '/work/repo path' && 'git' 'log' '--' 'src/a'\\''b.cpp'");
  });
});
