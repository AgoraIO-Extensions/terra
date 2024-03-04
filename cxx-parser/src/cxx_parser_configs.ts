import { resolvePath } from '@agoraio-extensions/terra-core';
import { globSync } from 'glob';

function _resolvePaths(globPath: string, configDir: string): string[] {
  // The files order will descend when using globSync. So we sort the files to ensure the order.
  return globSync(resolvePath(globPath, configDir)).sort();
}

export interface ParseFilesConfig {
  include: string[];
  exclude: string[];
}

export class ParseFilesConfig {
  /**
   * Resolves the files to be parsed based on the include and exclude configurations.
   *
   * The include and exclude configurations determine which files should be included or excluded from parsing.
   *
   * The logic for resolving the parse files is as follows:
   * - If include is specified, only files matching the include patterns will be included.
   * - If exclude is specified, files matching the exclude patterns will be excluded.
   * - If both include and exclude are specified, files matching the include patterns but not matching the exclude patterns will be included.
   * - If neither include nor exclude is specified, all files will be included.
   *
   * @returns An array of strings representing the files to be parsed.
   */
  static resolveParseFiles(config: ParseFilesConfig): string[] {
    return config.include.filter((it) => {
      return !config.exclude.includes(it);
    });
  }
}

export interface CXXParserConfigs {
  buildDirNamePrefix?: string;
  includeHeaderDirs: string[];
  definesMacros: string[];
  parseFiles: ParseFilesConfig;
}

export class CXXParserConfigs {
  static resolve(configDir: any, original: CXXParserConfigs): CXXParserConfigs {
    return {
      buildDirNamePrefix: original.buildDirNamePrefix,
      includeHeaderDirs: (original.includeHeaderDirs ?? [])
        .map((it) => {
          return _resolvePaths(it, configDir);
        })
        .flat(1),
      definesMacros: original.definesMacros ?? [],
      parseFiles: {
        include: (original.parseFiles.include ?? [])
          .map((it) => {
            return _resolvePaths(it, configDir);
          })
          .flat(1),
        exclude: (original.parseFiles.exclude ?? [])
          .map((it) => {
            return _resolvePaths(it, configDir);
          })
          .flat(1),
      } as ParseFilesConfig,
    };
  }
}
