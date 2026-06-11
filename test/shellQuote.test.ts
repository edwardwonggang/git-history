import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { quoteRemoteArg, quoteRemoteArgs } from '../src/shellQuote';

describe('quoteRemoteArg', () => {
  it('quotes empty values', () => {
    assert.equal(quoteRemoteArg(''), "''");
  });

  it('quotes shell-sensitive characters', () => {
    assert.equal(quoteRemoteArg('/work/repo path/src'), "'/work/repo path/src'");
    assert.equal(quoteRemoteArg("a'b"), "'a'\\''b'");
  });
});

describe('quoteRemoteArgs', () => {
  it('joins quoted arguments', () => {
    assert.equal(quoteRemoteArgs(['git', 'show', "HEAD:file with 'quote'.cpp"]), "'git' 'show' 'HEAD:file with '\\''quote'\\''.cpp'");
  });
});
