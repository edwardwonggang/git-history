# Gerrit History Extension TODO

## Phase 0 - Project Setup

- [x] Choose extension identifier, display name, and command labels.
- [x] Scaffold a TypeScript VS Code extension project.
- [x] Add compile and test scripts.
- [ ] Add lint script.
- [x] Add `.vscodeignore` and packaging basics.

## Phase 1 - Configuration

- [x] Add settings to `package.json`.
- [x] Implement `config.ts`.
- [x] Validate required settings: `sshHost`, `sshUser`, `linuxRepoPath`.
- [x] Support optional settings: `sshPort`, `defaultLimit`, `gitRef`, `commandTimeoutMs`.
- [x] Show actionable errors for missing or invalid settings.

## Phase 2 - Path Mapping

- [x] Implement workspace root detection.
- [x] Convert selected Explorer URI to workspace-relative path.
- [x] Normalize Windows separators to POSIX Git path separators.
- [x] Reject paths outside the workspace root.
- [x] Add unit tests for path mapping.

## Phase 3 - Remote Git Client

- [x] Implement SSH command execution wrapper.
- [x] Implement safe remote shell argument quoting.
- [x] Run Git commands from configured `linuxRepoPath`.
- [x] Add timeout support.
- [x] Add structured error handling for SSH and Git failures.
- [x] Add unit tests for command construction and quoting.

## Phase 4 - History Query

- [x] Implement `git log` query for selected path.
- [x] Add configurable recent-month history window, defaulting to 3 months.
- [x] Hide merge commits by default to avoid Gerrit submit merge wrapper diffs.
- [x] Add defensive filtering for Gerrit `Merge "..." into ...` wrapper subjects.
- [x] Use machine-parseable separators.
- [x] Parse commit hash, parents, author, email, date, and subject.
- [x] Limit result count using `defaultLimit`.
- [x] Show empty-history state.
- [x] Add parser unit tests.

## Phase 5 - VS Code UI

- [x] Register Explorer context menu command.
- [x] Register Gerrit History TreeView.
- [x] Show selected target path in the view message.
- [x] Show matching commits as child items.
- [x] Add refresh command.
- [x] Add copy commit hash command.

## Phase 6 - Changed Files

- [x] Load changed files lazily when a commit is expanded.
- [x] Implement changed-file query using parent-to-commit diff, with root commit fallback.
- [x] Parse added, modified, deleted, renamed, and copied statuses.
- [x] Scope results to selected path.
- [x] Display file status and relative path in the tree.
- [x] Add parser unit tests.

## Phase 7 - Diff View

- [x] Register before-content virtual document provider.
- [x] Register after-content virtual document provider.
- [x] Implement file content fetch for `<commit>^1:<file>`.
- [x] Implement file content fetch for `<commit>:<file>`.
- [x] Treat added-file before side as empty.
- [x] Treat deleted-file after side as empty.
- [x] Open VS Code left/right diff from changed-file tree item.
- [x] Cache fetched virtual document content during the session.

## Phase 8 - Edge Cases

- [x] Handle root commits with no parent.
- [x] Handle merge commits using first parent.
- [ ] Handle binary files with a clear message or patch fallback.
- [x] Handle file paths containing spaces.
- [x] Handle deleted paths.
- [x] Handle SSH connection failure.
- [x] Handle invalid Linux repository path.

## Phase 9 - Validation

- [x] Compile TypeScript.
- [x] Run unit tests.
- [ ] Manually test right-clicking a file.
- [ ] Manually test right-clicking a folder.
- [ ] Manually test modified-file diff.
- [ ] Manually test added-file diff.
- [ ] Manually test deleted-file diff.
- [ ] Manually test missing config behavior.

## Phase 10 - Packaging And Follow-Up

- [x] Add README usage instructions.
- [x] Add configuration examples.
- [x] Add known limitations.
- [x] Package `.vsix`.
- [x] Add automatic local reinstall script.
- [x] Document future Gerrit URL/API enhancement path.
