import fs from 'fs';

import os from 'os';
import path from 'path';

/**
 * Resolve the schema: `<module_name>:<path>`, or absolute path, or relative path
 */
export function resolvePath(
  p: string,
  prefixDirIfNotAbsolute: string = ''
): string {
  if (!p.includes(':')) {
    if (path.isAbsolute(p)) {
      return p;
    }

    if (prefixDirIfNotAbsolute == '') {
      return path.resolve(p);
    }

    return path.resolve(path.join(prefixDirIfNotAbsolute, p));
  }

  // e.g., shared_configs:headers/rtc_4.2.3/shared_configs.yaml
  let pathSplit = p.split(':');
  console.assert(pathSplit.length == 2);

  let moduleName = pathSplit[0];
  let pathInModule = pathSplit[1];
  let localModulePath = resolveModulePath(moduleName);
  let localPathInModule = path.join(localModulePath, pathInModule);

  return path.resolve(localPathInModule);
}

export function resolveModulePath(module: string): string {
  let currentPackageJsonPath = process.env.npm_package_json;
  let currentPackageNodeModuleDir = path.join(
    path.dirname(currentPackageJsonPath as string),
    'node_modules'
  );
  console.assert(fs.existsSync(currentPackageNodeModuleDir));

  let parserPackageDir = path.join(currentPackageNodeModuleDir, module);
  console.assert(fs.existsSync(parserPackageDir));

  return path.resolve(parserPackageDir);
}

export function requireModule(module: string): any {
  let currentPackageJsonPath = process.env.npm_package_json;
  let currentPackageNodeModuleDir = path.join(
    currentPackageJsonPath as string,
    '..',
    'node_modules'
  );
  console.assert(fs.existsSync(currentPackageNodeModuleDir));

  let parserPackageDir = path.join(currentPackageNodeModuleDir, module);
  let parserPackageJsonPath = path.join(parserPackageDir, 'package.json');
  let parserPackageJsonIndexFilePath = JSON.parse(
    fs.readFileSync(parserPackageJsonPath, 'utf-8')
  ).main;
  let parserPackageIndexFilePath = path.join(
    parserPackageDir,
    parserPackageJsonIndexFilePath
  );

  return require(path.resolve(parserPackageIndexFilePath));
}
