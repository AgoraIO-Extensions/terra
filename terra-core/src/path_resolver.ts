import fs from 'fs';

import path from 'path';

/**
 * Resolves a given path to its absolute form.
 * It can resolve paths in various formats: module schemas (`<module_name>:<path>`), absolute paths, or relative paths.
 * If the path is not absolute and `prefixDirIfNotAbsolute` is provided, the path is resolved relative to this directory.
 *
 * @param p The path to resolve, which can be in the format of a module schema, absolute, or relative path.
 * @param prefixDirIfNotAbsolute The directory to use as a prefix for non-absolute paths. Defaults to an empty string.
 * @returns The resolved absolute path.
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

/**
 * Resolves the path to a specified module.
 * This function assumes the module exists in the `node_modules` directory relative to the current package's `package.json`.
 *
 * @param module The name of the module to resolve.
 * @returns The resolved path of the module.
 */
// TODO(littlegnal): Use `require.resolve(`${module}/package.json`)` to require the module's path
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

/**
 * Requires a module and returns its exported content.
 * The module is expected to be located in the `node_modules` directory relative to the current package's `package.json`.
 *
 * @param module The name of the module to require.
 * @returns The exported content of the required module.
 */
// TODO(littlegnal): Use `require(`${module}/package.json`)` to require the module
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
