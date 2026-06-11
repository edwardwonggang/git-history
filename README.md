# Gerrit History

VS Code extension for inspecting merged Git/Gerrit history for a selected file or folder in a Linux-hosted repository.

## Usage

1. Open the mapped repository root in VS Code.
2. Configure the Linux repository connection in VS Code settings.
3. Right-click a file or folder in the Explorer.
4. Run `Show Merged Gerrit History`.
5. Expand commits in the `Gerrit History` view and open diffs for changed files.

## Settings

```json
{
  "gerritHistory.sshHost": "server-host-or-ip",
  "gerritHistory.sshUser": "user",
  "gerritHistory.sshPort": 22,
  "gerritHistory.linuxRepoPath": "/absolute/path/to/repo/on/linux",
  "gerritHistory.defaultLimit": 1000,
  "gerritHistory.historyMonths": 3,
  "gerritHistory.includeMergeCommits": false,
  "gerritHistory.gitRef": "HEAD",
  "gerritHistory.commandTimeoutMs": 30000
}
```

The extension uses the local `ssh` command and existing SSH authentication. Do not store passwords or private keys in settings.

## Local Development Install

Run this after each change to rebuild the VSIX and force-install it into VS Code:

```bash
npm run install:local
```

Reload VS Code windows after reinstalling.

## Limitations

- Only merged history available in the Linux Git repository is queried.
- The default query window is the last 3 months. Shallow clones must contain enough history for this window.
- Merge commits and Gerrit submit merge wrapper subjects are hidden by default to avoid misleading directory-wide diffs.
- Gerrit `Change-Id` is not required or displayed.
- If merge commits are enabled, they are diffed against the first parent.
- Rename tracking is basic in the first version.
