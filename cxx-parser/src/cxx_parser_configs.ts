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

export interface CXXParserConfigs {
  includeHeaderDirs: string[];
  definesMacros: string[];
  parseFiles: ParseFilesConfig;
  customHeaders: string[];
}

export class CXXParserConfigs {
  static resolve(configDir: any, original: CXXParserConfigs): CXXParserConfigs {
    return {
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
      },
      customHeaders: (original.customHeaders ?? [])
        .map((it) => {
          return _resolvePaths(it, configDir);
        })
        .flat(1),
    };
  }
}
