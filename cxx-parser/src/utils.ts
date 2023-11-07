import * as path from 'path';

export function getAbsolutePath(
  dir: string,
  maybeAbsolutePath: string
): string {
  if (!maybeAbsolutePath) return '';
  if (path.isAbsolute(maybeAbsolutePath)) {
    return maybeAbsolutePath;
  }

  return path.join(dir, maybeAbsolutePath);
}

export function getAbsolutePaths(
  dir: string,
  maybeAbsolutePaths: string[]
): string[] {
  if (!maybeAbsolutePaths) return [];
  let absolutePaths: string[] = [];
  for (let p of maybeAbsolutePaths) {
    if (!p) continue;

    if (path.isAbsolute(p)) {
      absolutePaths.push(p);
    } else {
      absolutePaths.push(path.join(dir, p));
    }
  }

  return absolutePaths;
}
