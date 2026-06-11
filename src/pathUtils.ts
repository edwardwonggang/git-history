export function toGitRelativePath(relativePath: string): string {
  return relativePath.replace(/[\\/]+/g, '/');
}
