import { execSync } from "child_process";
import * as fs from "fs";
import path from "path";
import {
  ParseResult,
  Parser,
  TerraContext,
} from "@agoraio-extensions/terra-core";
import { CXXFile, cast } from "./cxx_terra_node";
import { CXXParserConfigs } from "./cxx_parser_configs";

export function dumpCXXAstJson(
  terraContext: TerraContext,
  includeHeaderDirs: string[],
  customHeaders: string[],
  parseFiles: string[],
  defines: string[]
): string {
  let agora_rtc_ast_dir_path = path.join(
    __dirname,
    "..",
    "cxx",
    "cppast_backend"
  );

  let build_shell_path = path.join(agora_rtc_ast_dir_path, "build.sh");
  let build_cache_dir_path = path.join(agora_rtc_ast_dir_path, "build");
  let outputJsonPath = path.join(build_cache_dir_path, "dump_json.json");

  if (terraContext.clean && fs.existsSync(build_cache_dir_path)) {
    fs.rmSync(build_cache_dir_path, { recursive: true, force: true });
  }

  let include_header_dirs_arg = includeHeaderDirs.join(",");
  let visit_headers_arg = parseFiles.join(",");

  let bashArgs: string = `--visit-headers=${visit_headers_arg} --include-header-dirs=${include_header_dirs_arg}`;

  let definess = defines.join(",");
  bashArgs += ` --defines-macros=\"${definess}\"`;

  if (customHeaders) {
    bashArgs += ` --custom-headers=${customHeaders.join(",")}`;
  }

  bashArgs += ` --output-dir=${outputJsonPath}`;

  bashArgs += ` --dump-json`;

  let buildScript = `bash ${build_shell_path} \"${bashArgs}\"`;
  console.log(`Running command: \n${buildScript}`);

  execSync(buildScript, { encoding: "utf8", stdio: "inherit" });

  let ast_json_file_content = fs.readFileSync(outputJsonPath, "utf-8");
  return ast_json_file_content;
}

export function genParseResultFromJson(astJsonContent: string): ParseResult {
  let ast_json = JSON.parse(astJsonContent, (key, value) => {
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value;
      }
      return cast(value);
    }

    return value;
  });
  var parseResult: ParseResult = new ParseResult();
  let cxxFiles: CXXFile[] = ast_json;

  parseResult.nodes = cxxFiles;

  return parseResult;
}

export function CXXParser(
  terraContext: TerraContext,
  args: any,
  parseResult?: ParseResult
): ParseResult | undefined {
  let cxxParserConfigs = CXXParserConfigs.resolve(terraContext.configDir, args);

  let parseFiles = cxxParserConfigs.parseFiles.include.filter((it) => {
    return !cxxParserConfigs.parseFiles.exclude.includes(it);
  });
  let jsonContent = dumpCXXAstJson(
    terraContext,
    cxxParserConfigs.includeHeaderDirs,
    cxxParserConfigs.customHeaders,
    parseFiles,
    cxxParserConfigs.definesMacros
  );

  return genParseResultFromJson(jsonContent);
}
