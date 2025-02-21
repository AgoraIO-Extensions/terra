import { strict as assert } from 'assert';
import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';

import { CXXTYPE } from '@agoraio-extensions/cxx-parser';
import { CXXFile } from '@agoraio-extensions/cxx-parser/src/cxx_terra_node';
import { ParseResult } from '@agoraio-extensions/terra-core';

import { generateChecksum, getCppAstBackendDir } from './cxx_parser';

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

export enum TagUsedType {
  struct_t = 'struct',
  class_t = 'class',
}

/**
 * The node type:
 * https://clang.llvm.org/doxygen/Decl_8h_source.html
 */
export enum ClangASTNodeKind {
  TranslationUnitDecl = 'TranslationUnitDecl',
  NamespaceDecl = 'NamespaceDecl',
  TypedefDecl = 'TypedefDecl',
  CXXRecordDecl = 'CXXRecordDecl',
  FieldDecl = 'FieldDecl',
  FullComment = 'FullComment',
  ParagraphComment = 'ParagraphComment',
  TextComment = 'TextComment',
  InlineCommandComment = 'InlineCommandComment',
  CXXConstructorDecl = 'CXXConstructorDecl',
  CXXCtorInitializer = 'CXXCtorInitializer',
  CXXBoolLiteralExpr = 'CXXBoolLiteralExpr',
  ParmVarDecl = 'ParmVarDecl',
  ImplicitCastExpr = 'ImplicitCastExpr',
  CXXConstructExpr = 'CXXConstructExpr',
  GNUNullExpr = 'GNUNullExpr',
  CXXNullPtrLiteralExpr = 'CXXNullPtrLiteralExpr',
  IntegerLiteral = 'IntegerLiteral',
  FloatingLiteral = 'FloatingLiteral',
  DeclRefExpr = 'DeclRefExpr',
  EnumConstantDecl = 'EnumConstantDecl',
  UnaryOperator = 'UnaryOperator',
  CXXMethodDecl = 'CXXMethodDecl',
}

/**
 * Intermediate objects used internally
 */
export interface _FlattenNode {
  ns: string; // namespace
  node: any;
}

/**
 *
 * @returns The default include dirs for clang command line tool
 */
function getDefaultIncludeDirs(): string[] {
  function _findIncludeDirsFromClang(): string[] {
    let verbose_output: string = '';
    let verboseCommand = 'clang++ -xc++ -v -';
    try {
      execSync(verboseCommand, {
        input: '',
        stdio: ['pipe', 'pipe', 'pipe'], // Pipe stdin, stdout, and stderr
        encoding: 'utf-8',
      }).toString();
    } catch (error: any) {
      // We need to use the tricky wayt to get the verbose output from clang
      verbose_output = error.message ?? '';
    }

    // If the command failed, return the empty include header dirs
    if (!verbose_output) {
      return [];
    }

    let verboseOutputInLines = verbose_output.split('\n');

    verboseOutputInLines = verboseOutputInLines.slice(
      verboseOutputInLines.findIndex((it) => {
        return it.startsWith('#include <...>');
      }) + 1, // Do not include the index of '#include <...>'
      verboseOutputInLines.findIndex((it) => {
        return it.startsWith('End of search list.');
      })
    );
    let includeDirs = verboseOutputInLines
      .filter((it) => {
        return it.startsWith(' ');
      })
      .map((it) => {
        if (it.includes(' (')) {
          // /Library/Developer/CommandLineTools/SDKs/MacOSX13.sdk/System/Library/Frameworks (framework directory)
          return it.trim().split(' (')[0];
        }

        return it.trim();
      });

    return includeDirs.map((it) => path.resolve(it));
  }

  return [
    ..._findIncludeDirsFromClang(),
    // Add cxx-parser/cxx/cppast_backend/include/system_fake
    path.join(getCppAstBackendDir(), 'include', 'system_fake'),
  ];
}

/**
 * This function mainly use the clang command line tool to dump the AST in json format,
 * ```
 * clang++ -fsyntax-only -Xclang -ast-dump=json \
 *    -I /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include \
 *    -I /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include/c++/v1/
 *    <parse-files> > output.json
 * ```
 * More detail: https://clang.llvm.org/docs/IntroductionToTheClangAST.html
 *
 * For debug, you can dump the normal AST format which is more readable,
 * ```
 * clang++ -fsyntax-only -Xclang -ast-dump -fno-color-diagnostics \
 *    -I /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include \
 *    -I /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include/c++/v1/ \
 *    <parse-files> > output.txt
 * ````
 */
export function dumpClangASTJSON(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFile: string
): string {
  // In some systems, if the llvm path spefic to the `PATH` environment variables, the clang AST
  // will run with error that can not find the std headers, e.g.,
  // `/opt/homebrew/opt/llvm@15/include/c++/v1/stdio.h:107:15: fatal error: 'stdio.h' file not found`.
  // So we filter the llvm path from the `PATH` to run the clang AST, it's a little tricky but for a workaround.
  function _clangCLIEnv() {
    let originalEnv = process.env;
    let pathEnv = process.env.PATH;
    if (pathEnv) {
      pathEnv = pathEnv
        .split(':')
        .filter((it) => !it.includes('llvm'))
        .join(':');
    }

    return {
      ...originalEnv,
      PATH: pathEnv,
    };
  }

  let fileName = path.basename(parseFile);
  let checksum = generateChecksum([parseFile]);

  // dump_clang_ast_<file name>_<checksum>.json
  let clangAstJsonPath = path.join(
    buildDir,
    `dump_clang_ast_${fileName}_${checksum}.json`
  );

  // If the cache found, just return it.
  // Note that we are no need to handle the `TerraContext.clean` in this function, since if the
  // clean flag passed from the command line, the `CXXParser` will handle it first, the build dir
  // will be cleaned.
  if (fs.existsSync(clangAstJsonPath)) {
    return fs.readFileSync(clangAstJsonPath, 'utf-8');
  }

  let includeHeaderDirsNew = [...getDefaultIncludeDirs(), ...includeHeaderDirs];
  let includeHeaderDirsArgs = includeHeaderDirsNew.map((it) => {
    return `-I ${it}`;
  });

  let args = ['-Xclang', '-ast-dump=json', '-fsyntax-only', '-std=c++11'];
  let _args = [...args, ...includeHeaderDirsArgs, parseFile].join(' ');

  let bashScript = `clang++ ${_args} > ${clangAstJsonPath}`;
  console.log(`Running command: \n${bashScript}`);

  try {
    execSync(bashScript, {
      stdio: ['pipe', 'pipe', 'pipe'], // Pipe stdin, stdout, and stderr,
      encoding: 'utf8',
      env: _clangCLIEnv(),
    });
  } catch (err: any) {
    let errMessage = err.message;
    // Eliminate the fatal error summary, and then see if there's any other fatal error message, like
    // /usr/local/Cellar/llvm@15/15.0.7/lib/clang/15.0.7/include/arm64intr.h:12:15: fatal error: 'arm64intr.h' file not found
    errMessage = errMessage.replace(
      'fatal error: too many errors emitted, stopping now [-ferror-limit=]',
      ''
    );
    if (errMessage.includes('fatal error:')) {
      // The file in path `clangAstJsonPath` will be created no matter the clang command failed or not,
      // so we need to remove it if the clang command failed.
      if (fs.existsSync(clangAstJsonPath)) {
        fs.rmSync(clangAstJsonPath);
      }
      console.error(err.message);
      process.exit(err.status);
    }

    console.log(errMessage);
  }

  let ast_json_file_content = fs.readFileSync(clangAstJsonPath, 'utf-8');
  return ast_json_file_content;
}

export function filterAndFlattenNodes(
  parseFiles: string,
  astJson: string
): Array<_FlattenNode> {
  let jsonObj = JSON.parse(astJson);
  // The first object kind is `TranslationUnitDecl`
  assert(jsonObj.kind == ClangASTNodeKind.TranslationUnitDecl);
  // `inner` should have values
  assert(jsonObj.inner && Array.isArray(jsonObj.inner));

  function _flattenNodes(
    inner: any,
    nsStack: string[],
    filterByFile: boolean = true
  ): Array<_FlattenNode> {
    let res = new Array<_FlattenNode>();

    for (let n of inner) {
      if (filterByFile) {
        if (!n.loc?.file) {
          continue;
        }

        if (!parseFiles.includes(n.loc.file)) {
          continue;
        }
      }

      switch (n.kind) {
        case ClangASTNodeKind.NamespaceDecl:
          nsStack.push(n.name);
          res.push(..._flattenNodes(n.inner, nsStack, false));
          nsStack.pop();
          break;
        default:
          res.push({ ns: nsStack.join('::'), node: n });
          break;
      }
    }

    return res;
  }

  let res = _flattenNodes(jsonObj.inner, []);

  return res;
}

export function fillParentNode_ForParseResult(
  parseResult: ParseResult | undefined
) {
  if (!parseResult) {
    return undefined;
  }

  fillParentNode(parseResult, parseResult.nodes as CXXFile[]);
}

export function fillParentNode(parseResult: ParseResult, cxxFiles: CXXFile[]) {
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
