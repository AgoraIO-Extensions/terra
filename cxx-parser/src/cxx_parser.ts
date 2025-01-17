import { execSync } from 'child_process';
import crypto from 'crypto';
import * as fs from 'fs';
import path from 'path';

import './cxx_parser_ext';

import { ParseResult, TerraContext } from '@agoraio-extensions/terra-core';

import { ClangASTStructConstructorParser } from './constructor_initializer_parser';
import { ClangASTQualTypeParser } from './qualtype_parser';
import { CXXParserConfigs, ParseFilesConfig } from './cxx_parser_configs';
import { CXXFile, CXXTYPE, CXXTerraNode, cast } from './cxx_terra_node';

export function generateChecksum(files: string[]) {
  let allFileContents = files
    .map((it) => {
      return fs.readFileSync(it, 'utf-8');
    })
    .join('\n');

  return crypto
    .createHash('md5')
    .update(allFileContents)
    .digest('hex')
    .toString();
}

function getBuildDir(
  terraContext: TerraContext,
  buildDirNamePrefix?: string | undefined
) {
  let prefix = buildDirNamePrefix ?? '';
  if (prefix.length) {
    prefix = `${prefix}_`;
  }
  // <my_project>/.terra/cxx_parser
  return path.join(terraContext.buildDir, `${prefix}cxx_parser`);
}

export function getCppAstBackendDir() {
  return path.join(__dirname, '..', 'cxx', 'cppast_backend');
}

export function dumpCXXAstJson(
  terraContext: TerraContext,
  includeHeaderDirs: string[],
  parseFiles: string[],
  defines: string[],
  buildDirNamePrefix?: string | undefined
): string {
  let parseFilesChecksum = generateChecksum(parseFiles);

  let buildDir = getBuildDir(terraContext, buildDirNamePrefix);
  let preProcessParseFilesDir = path.join(
    buildDir,
    `preProcess@${parseFilesChecksum}`
  );

  let agora_rtc_ast_dir_path = getCppAstBackendDir();

  let build_shell_path = path.join(agora_rtc_ast_dir_path, 'build.sh');
  let build_cache_dir_path = buildDir;
  let outputJsonFileName = `dump_json_${parseFilesChecksum}.json`;
  let outputJsonPath = path.join(build_cache_dir_path, outputJsonFileName);

  if (terraContext.clean && fs.existsSync(build_cache_dir_path)) {
    fs.rmSync(build_cache_dir_path, { recursive: true, force: true });
  }

  // If the previous output json cache exists, skip the process of cppast parser
  if (fs.existsSync(outputJsonPath)) {
    console.log(
      `Skip the process of cppast parser, use the cached ast json file: ${outputJsonPath}`
    );
    let ast_json_file_content = fs.readFileSync(outputJsonPath, 'utf-8');
    return ast_json_file_content;
  }

  // Ensure the build cache dir exists
  if (!fs.existsSync(build_cache_dir_path)) {
    fs.mkdirSync(build_cache_dir_path, { recursive: true });
  }

  let include_header_dirs_arg = includeHeaderDirs.join(',');
  let visit_headers_arg = parseFiles.join(',');

  let bashArgs: string = `--visit-headers=${visit_headers_arg} --include-header-dirs=${include_header_dirs_arg}`;

  let definess = defines.join(',');
  bashArgs += ` --defines-macros=\"${definess}\"`;

  bashArgs += ` --output-dir=${outputJsonPath}`;

  bashArgs += ` --pre-process-dir=${preProcessParseFilesDir}`;

  bashArgs += ` --dump-json`;

  let buildScript = `bash ${build_shell_path} \"${buildDir}\" \"${bashArgs}\"`;
  console.log(`Running command: \n${buildScript}`);

  execSync(buildScript, { encoding: 'utf8', stdio: 'inherit' });

  let ast_json_file_content = fs.readFileSync(outputJsonPath, 'utf-8');
  return ast_json_file_content;
}

export function genParseResultFromJson(astJsonContent: string): ParseResult {
  const cxxFiles: CXXFile[] = JSON.parse(astJsonContent, (key, value) => {
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value;
      }
      return cast(value);
    }
    return value;
  });

  const parseResult = new ParseResult();
  parseResult.nodes = cxxFiles;
  fillParentNode(parseResult, cxxFiles);
  return parseResult;
}

export function CXXParser(
  terraContext: TerraContext,
  args: any,
  _?: ParseResult
): ParseResult | undefined {
  let cxxParserConfigs = CXXParserConfigs.resolve(terraContext.configDir, args);

  let parseFiles = ParseFilesConfig.resolveParseFiles(
    cxxParserConfigs.parseFiles
  );
  let jsonContent = dumpCXXAstJson(
    terraContext,
    cxxParserConfigs.includeHeaderDirs,
    parseFiles,
    cxxParserConfigs.definesMacros,
    cxxParserConfigs.buildDirNamePrefix
  );

  let newParseResult = genParseResultFromJson(jsonContent);

  // Use the parsed file path from cppast parser to avoid additional operations for the file,
  // e.g., the macros operations
  let cppastParsedFiles = newParseResult.nodes.map((it) => {
    return (it as CXXFile).file_path;
  });

  ClangASTStructConstructorParser(
    getBuildDir(terraContext, cxxParserConfigs.buildDirNamePrefix),
    cxxParserConfigs.includeHeaderDirs,
    cppastParsedFiles,
    newParseResult
  );

  if(cxxParserConfigs.parseClangQualType){
    ClangASTQualTypeParser(
      getBuildDir(terraContext, cxxParserConfigs.buildDirNamePrefix),
      cxxParserConfigs.includeHeaderDirs,
      cppastParsedFiles,
      newParseResult
    );
  }



  return newParseResult;
}

/// Workaround for finding the parent nodes with the same name, this only works if the namespaces are different.
/// To excectly find the parent node, we need to add more infos in `CXXTerraNode` to identity the unique parent node.
function _findParent(
  parseResult: ParseResult,
  parentName: string
): CXXTerraNode | undefined {
  function _findResolvedNodeRecursively(
    node: CXXTerraNode
  ): CXXTerraNode | undefined {
    let tmpFullName = node.parent_name
      ? `${node.parent_name}::${node.name}`
      : `${node.namespaces.join('::')}::${node.name}`;
    let tmpNode = parseResult.resolveNodeByName(tmpFullName);
    if (tmpNode && tmpNode.parent_name) {
      // recursively find the parent node
      tmpNode = _findResolvedNodeRecursively(tmpNode);
    }
    return tmpNode;
  }
  let foundNode: CXXTerraNode | undefined;

  for (const f of parseResult.nodes) {
    let cxxFile = f as CXXFile;
    let foundNodes = cxxFile.nodes.filter((node) => node.name == parentName);
    if (foundNodes.length == 0) {
      continue;
    }

    if (foundNodes.length == 1) {
      return foundNodes[0];
    }

    for (let node of foundNodes) {
      // find the most matched node
      foundNode = _findResolvedNodeRecursively(node);
      if (foundNode) {
        return foundNode;
      }
    }
  }

  return foundNode;
}

function fillParentNode(parseResult: ParseResult, cxxFiles: CXXFile[]) {
  cxxFiles.forEach((file) => {
    file.nodes.forEach((node) => {
      if (node.parent_full_scope_name) {
        node.parent =
          parseResult.resolveNodeByName(node.parent_full_scope_name) ?? file; // _findParent(parseResult, node.parent_name);
      } else {
        node.parent = file;
      }

      if (node.__TYPE === CXXTYPE.Clazz) {
        node.asClazz().constructors.forEach((constructor) => {
          constructor.parent = node;
          constructor.parameters.forEach((param) => {
            param.parent = constructor;
            param.type.parent = param;
          });
        });
        node.asClazz().methods.forEach((method) => {
          method.parent = node;
          method.parameters.forEach((param) => {
            param.parent = method;
            param.type.parent = param;
          });
          method.return_type.parent = method;
        });
        node.asClazz().member_variables.forEach((variable) => {
          variable.parent = node;
          variable.type.parent = variable;
        });
      } else if (node.__TYPE === CXXTYPE.Struct) {
        node.asStruct().constructors.forEach((constructor) => {
          constructor.parent = node;
          constructor.parameters.forEach((param) => {
            param.parent = constructor;
            param.type.parent = param;
          });
        });
        node.asStruct().member_variables.forEach((variable) => {
          variable.parent = node;
          variable.type.parent = variable;
        });
      } else if (node.__TYPE === CXXTYPE.Enumz) {
        node.asEnumz().enum_constants.forEach((enum_constant) => {
          enum_constant.parent = node;
        });
      }
    });
  });
}
