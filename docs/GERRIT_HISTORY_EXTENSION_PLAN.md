# VS Code Gerrit History Extension Plan

## 1. Goal

Build a VS Code extension that lets a user right-click a file or folder in the Explorer and inspect all merged codebase commits that changed that path.

The extension should:

- Work when VS Code opens a Windows mapped drive that points to a Linux server repository.
- Treat the opened folder as the Git repository root.
- Query merged history from the Linux-side Git repository.
- Show matching commits in a VS Code list/tree.
- Let the user click a commit and inspect which files under the selected path changed.
- Open VS Code left/right diff views for the selected file at that commit.

This version does not depend on Gerrit `Change-Id`, because commit messages do not contain one.

## 2. MVP Scope

The first usable version should include:

- Explorer context menu command for files and folders.
- Workspace configuration for Linux repository access.
- Git history query for the selected relative path.
- TreeView or Webview list of matching merged commits.
- Per-commit changed-file list scoped to the selected path.
- VS Code diff view for a changed file before and after the selected commit.
- Basic error handling for missing config, SSH failure, missing Git repository, and deleted/added files.

The MVP should not include:

- Gerrit API integration.
- Open review / pending change search.
- Authentication UI.
- Complex branch selection UI.
- Rename-following across the whole history.
- Persistent database indexing.

## 3. Expected User Flow

1. User opens the mapped repository root in VS Code.
2. User right-clicks a file or folder in Explorer.
3. User selects `Show Merged Gerrit History`.
4. Extension computes the selected path relative to the VS Code workspace root.
5. Extension runs Git commands on the Linux server under the configured Linux repository path.
6. Extension shows commits that touched the selected path.
7. User clicks a commit.
8. Extension shows files under the selected path changed by that commit.
9. User clicks a file.
10. Extension opens a VS Code diff view:
    - left: file content before the commit
    - right: file content after the commit

## 4. Configuration Model

Use VS Code settings rather than hard-coding server data.

Suggested settings:

```json
{
  "gerritHistory.sshHost": "server-host-or-ip",
  "gerritHistory.sshUser": "user",
  "gerritHistory.linuxRepoPath": "/absolute/path/to/repo/on/linux",
  "gerritHistory.sshPort": 22,
  "gerritHistory.defaultLimit": 200,
  "gerritHistory.gitRef": "HEAD"
}
```

Notes:

- Do not store passwords, private keys, or tokens in extension settings.
- Prefer system SSH config and existing key-based login.
- `linuxRepoPath` is required because the Windows mapped drive path cannot reliably reveal the Linux absolute path.
- `gitRef` defaults to `HEAD`, but can later support branch names such as `origin/master`.

## 5. Path Mapping

The extension should assume:

- VS Code workspace root maps to `gerritHistory.linuxRepoPath`.
- A selected Windows path can be converted to a Linux path by taking its relative path from the workspace root and appending it to the Linux repo path.

Example:

- VS Code workspace root: `Z:\project`
- Selected path: `Z:\project\src\module`
- Relative path: `src/module`
- Linux repo path: `/work/repo/project`
- Linux target path: `/work/repo/project/src/module`

All Git commands should run from `linuxRepoPath` and pass only the repository-relative path after `--`.

## 6. Git Command Strategy

### Query Commits

Use a machine-parseable format:

```bash
git log --date=iso-strict --format='%H%x1f%P%x1f%an%x1f%ae%x1f%ad%x1f%s%x1e' -n <limit> <ref> -- <relative-path>
```

Fields:

- full commit hash
- parent hashes
- author name
- author email
- author date
- subject

Records are separated by ASCII record separator `0x1e`, fields by unit separator `0x1f`.

### Query Files Changed By Commit

```bash
git diff-tree --no-commit-id --name-status -r <commit> -- <relative-path>
```

This returns status and file paths scoped to the selected file or folder.

### Get File Content Before Commit

For normal commits:

```bash
git show <commit>^1:<file>
```

For root commits, there may be no parent. Treat the before side as empty.

### Get File Content After Commit

```bash
git show <commit>:<file>
```

For deleted files, treat the after side as empty.

### Merge Commits

For MVP, use the first parent for before-content:

```bash
git show <commit>^1:<file>
```

This matches the usual mainline history view after Gerrit submission.

## 7. Extension Architecture

Suggested modules:

- `extension.ts`
  - activate extension
  - register commands
  - register TreeView
  - register virtual document providers

- `config.ts`
  - read and validate VS Code settings

- `pathMapper.ts`
  - compute workspace-relative path
  - normalize to POSIX-style Git path

- `sshGitClient.ts`
  - execute remote SSH Git commands
  - quote command arguments safely
  - parse command output

- `historyProvider.ts`
  - load commit history for selected path
  - load changed files for selected commit

- `diffContentProvider.ts`
  - provide virtual documents for before/after content
  - back virtual URIs used by `vscode.diff`

- `views/historyTreeProvider.ts`
  - represent selected target, commits, and changed files in TreeView

## 8. VS Code UI Design

Use a TreeView in the Activity Bar or Explorer contribution area.

Recommended tree shape:

```text
Gerrit History
└─ src/module
   ├─ a1b2c3d  2026-01-10  Fix parser crash
   │  ├─ M src/module/parser.cpp
   │  └─ A src/module/parser_test.cpp
   └─ d4e5f6a  2025-12-03  Refactor module init
      └─ M src/module/init.cpp
```

Commands:

- `gerritHistory.showHistory`
  - Explorer context menu command.
- `gerritHistory.refresh`
  - Refresh current query.
- `gerritHistory.openDiff`
  - Open diff for a changed file in a selected commit.
- `gerritHistory.copyCommitHash`
  - Copy commit hash.

## 9. Diff Behavior

Use VS Code virtual document providers instead of writing temporary files.

URI examples:

```text
gerrit-history-before:/src/module/file.cpp?commit=<sha>
gerrit-history-after:/src/module/file.cpp?commit=<sha>
```

The provider fetches content through `sshGitClient`.

Diff title format:

```text
file.cpp: <short-sha> before <-> after
```

Added file:

- before side is empty.
- after side is `git show <commit>:<file>`.

Deleted file:

- before side is `git show <commit>^1:<file>`.
- after side is empty.

Modified file:

- both sides are fetched.

## 10. Command Execution And Quoting

SSH command execution must be careful because paths may contain spaces or shell-sensitive characters.

Recommended approach:

- Run one remote shell command through `ssh`.
- Always `cd` to the configured repo path.
- Pass Git pathspecs after `--`.
- Quote remote shell arguments with a dedicated helper.
- Do not concatenate raw user-selected paths into commands.

Example remote command shape:

```bash
cd '<linuxRepoPath>' && git log ... -- '<relative-path>'
```

## 11. Error Handling

Handle these cases explicitly:

- No workspace folder open.
- Multiple workspace folders open and selected file does not belong to the active root.
- Selected path is outside workspace root.
- Required settings are missing.
- SSH executable is missing.
- SSH connection fails.
- Linux repository path does not exist.
- Linux repository path is not a Git repository.
- Git command times out.
- Selected path has no matching history.
- File was added, deleted, renamed, or is binary.
- Commit has no parent.

Error messages should be short and actionable.

## 12. Performance Plan

MVP:

- Limit history to `gerritHistory.defaultLimit`.
- Load changed files only when a commit is expanded.
- Load file contents only when a diff is opened.
- Cache fetched content by `(commit, file, side)` during the session.

Later:

- Add pagination.
- Add author/date filters.
- Cache commit history per selected path.
- Support cancellation tokens.

## 13. Testing Strategy

Unit tests:

- Configuration validation.
- Windows path to Git-relative POSIX path conversion.
- Remote shell argument quoting.
- Git log output parsing.
- `diff-tree` output parsing.
- Added/deleted/modified file side resolution.

Integration/manual tests:

- Right-click a file and load history.
- Right-click a folder and load history.
- Open diff for modified file.
- Open diff for added file.
- Open diff for deleted file.
- Handle missing config.
- Handle SSH failure.
- Handle no matching history.

## 14. Future Enhancements

- Gerrit URL pattern setting and "Open in Gerrit" command.
- Query Gerrit metadata by commit hash if the server supports it.
- Branch selector.
- Date range and author filters.
- Search within loaded commits.
- Rename-following mode using `git log --follow` for files.
- Patch view fallback for binary or very large files.
- Multi-root workspace support.
- Remote SSH workspace mode support.

## 15. Main Risks

- The mapped Windows path may not always correspond exactly to the Linux repository path.
- Large repositories may make unrestricted history queries slow.
- Merge commits can be ambiguous if the desired diff parent is not first parent.
- Lack of `Change-Id` means Gerrit-specific linking requires another lookup mechanism.
- SSH quoting bugs can cause incorrect paths or command failures.

## 16. Recommended Milestones

1. Scaffold VS Code extension.
2. Add settings and config validation.
3. Add Explorer context command and relative path mapping.
4. Add SSH Git client.
5. Add commit history query and parser.
6. Add TreeView commit list.
7. Add lazy changed-file loading.
8. Add virtual document provider and VS Code diff command.
9. Add tests for path mapping, parsing, and quoting.
10. Package and manually verify on the mapped Linux repository.
