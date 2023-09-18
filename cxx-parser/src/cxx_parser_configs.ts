import { resolvePath } from "@agoraio-extensions/terra-core";
import { globSync } from "glob";

function _resolvePaths(globPaths: string[]): string[] {
  let res: string[] = [];
  globPaths.forEach((it) => {
    res.push(...globSync(it));
  });
  return res;
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
      includeHeaderDirs: original.includeHeaderDirs
        .map((it) => {
          return globSync(resolvePath(it, configDir));
        })
        .flat(1),
      definesMacros: original.definesMacros ?? [],
      parseFiles: {
        include: original.parseFiles.include
          .map((it) => {
            return globSync(resolvePath(it, configDir));
          })
          .flat(1),
        exclude: original.parseFiles.exclude
          .map((it) => {
            return globSync(resolvePath(it, configDir));
          })
          .flat(1),
      },
      customHeaders: original.customHeaders
        .map((it) => {
          return globSync(resolvePath(it, configDir));
        })
        .flat(1),
    };
  }
}
