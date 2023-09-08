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
  // static parse(config: any, cache: boolean): CXXParserConfigs {
  //   let yamlContent = fs.readFileSync(config, "utf8");
  //   let parsedYaml = YAML.parse(yamlContent);
  //   let include: string = parsedYaml.include ?? "";

  //   let includePath: string = "";
  //   if (include) {
  //     if (include.startsWith("shared:")) {
  //       let shared_configs_path = path.join(
  //         getAppRootPath(),
  //         "..",
  //         "configs",
  //         "headers"
  //       );
  //       includePath = path.join(
  //         shared_configs_path,
  //         include.replace("shared:", "")
  //       );
  //     } else {
  //       includePath = getAbsolutePath(config, include);
  //     }
  //   }

  //   return {
  //     include: includePath,
  //     language: parsedYaml.language,
  //     includeHeaderDirs: getAbsolutePaths(
  //       path.dirname(config),
  //       parsedYaml.include_header_dirs ?? []
  //     ),
  //     definesMacros: parsedYaml.defines_macros ?? [],
  //     visitHeaders: getAbsolutePaths(
  //       path.dirname(config),
  //       parsedYaml.visit_headers ?? []
  //     ),
  //     customHeaders: getAbsolutePaths(
  //       path.dirname(config),
  //       parsedYaml.custom_headers ?? []
  //     ),
  //     legacyFlags: parsedYaml.legacy_flags ?? [],
  //     legacyRenders: parsedYaml.legacy_renders ?? [],
  //     parsers: parsedYaml.parsers,
  //     renderers: parsedYaml.renderers,
  //     cache: cache,
  //   };
  // }

  // static merge(
  //   {
  //     include,
  //     language,
  //     includeHeaderDirs,
  //     definesMacros,
  //     visitHeaders,
  //     customHeaders,
  //     legacyFlags,
  //     legacyRenders,
  //     parsers,
  //     renderers,
  //     cache,
  //   }: CXXParserConfigs,
  //   includeConfigs: CXXParserConfigs
  // ): CXXParserConfigs {
  //   return {
  //     include,
  //     language,
  //     includeHeaderDirs: [
  //       ...includeHeaderDirs,
  //       ...includeConfigs.includeHeaderDirs,
  //     ],
  //     definesMacros: [...definesMacros, ...includeConfigs.definesMacros],
  //     visitHeaders: [...visitHeaders, ...includeConfigs.visitHeaders],
  //     customHeaders: [...customHeaders, ...includeConfigs.customHeaders],
  //     legacyFlags: [...legacyFlags, ...includeConfigs.legacyFlags],
  //     legacyRenders: [...legacyRenders, ...includeConfigs.legacyRenders],
  //     parsers,
  //     renderers,
  //     cache,
  //   };
  // }

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
