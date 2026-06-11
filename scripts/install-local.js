const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const vsixPath = path.join(root, 'gerrit-history.vsix');

main();

function main() {
  const vsce = resolveLocalBin('vsce');
  const code = resolveVSCodeCli();

  run(vsce, ['package', '--allow-missing-repository', '--out', vsixPath], root);
  run(code, ['--install-extension', vsixPath, '--force'], root);

  console.log(`Installed ${vsixPath}`);
  console.log('Reload VS Code windows that should use the updated extension.');
}

function resolveLocalBin(name) {
  const suffix = process.platform === 'win32' ? '.cmd' : '';
  const local = path.join(root, 'node_modules', '.bin', `${name}${suffix}`);
  if (fs.existsSync(local)) {
    return local;
  }
  return `${name}${suffix}`;
}

function resolveVSCodeCli() {
  if (process.env.VSCODE_CLI_PATH && fs.existsSync(process.env.VSCODE_CLI_PATH)) {
    return process.env.VSCODE_CLI_PATH;
  }

  const fromPath = findOnPath(process.platform === 'win32' ? 'code.cmd' : 'code');
  if (fromPath) {
    return fromPath;
  }

  const candidates = process.platform === 'win32'
    ? [
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(process.env.ProgramFiles || '', 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft VS Code', 'bin', 'code.cmd')
      ]
    : [
        '/usr/local/bin/code',
        '/usr/bin/code'
      ];

  const found = candidates.find(candidate => candidate && fs.existsSync(candidate));
  if (found) {
    return found;
  }

  throw new Error('VS Code CLI was not found. Install the "code" command or set VSCODE_CLI_PATH.');
}

function findOnPath(command) {
  const lookup = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(lookup, [command], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0 || !result.stdout) {
    return undefined;
  }

  return result.stdout.split(/\r?\n/).map(line => line.trim()).find(Boolean);
}

function run(command, args, cwd) {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = process.platform === 'win32'
    ? spawnSync([quoteWindowsArg(command), ...args.map(quoteWindowsArg)].join(' '), {
        cwd,
        stdio: 'inherit',
        shell: true
      })
    : spawnSync(command, args, {
        cwd,
        stdio: 'inherit'
      });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function quoteWindowsArg(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
