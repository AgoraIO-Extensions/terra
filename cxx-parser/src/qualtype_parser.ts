import { ParseResult, visibleForTesting } from '@agoraio-extensions/terra-core';

import { generateChecksum, getCppAstBackendDir } from './cxx_parser';
import {
  CXXFile,
  CXXTYPE,
  CXXTerraNode,
  Constructor,
  ConstructorInitializer,
  ConstructorInitializerKind,
  SimpleType,
  Struct,
} from './cxx_terra_node';

import {
  ClangASTNodeKind,
  TagUsedType,
  _FlattenNode,
  dumpClangASTJSON,
  filterAndFlattenNodes,
} from './utils';

const STR_UNDEFINED = 'Undefined';

class ASTNodeKey {
  constructor(
    // public kind: string | undefined,
    // public tagUsed: string | undefined,
    // public name: string | undefined

    public parent_full_scope_name: string | undefined,
    public name: string | undefined
  ) {}

  toString(): string {
    // const valKind = this.kind ?? STR_UNDEFINED;
    // const valTagUsed = this.tagUsed ?? STR_UNDEFINED;
    // const valName = this.name ?? STR_UNDEFINED;
    // return `${valKind}:${valTagUsed}:${valName}`;

    const valParentFullScopeName = this.parent_full_scope_name ?? STR_UNDEFINED;
    const valName = this.name ?? STR_UNDEFINED;
    return `${valParentFullScopeName}::${valName}`;
  }
}

class ASTNodeMap {
  private map = new Map<string, string[]>();

  set(key: ASTNodeKey, qualType: string | undefined): void {
    const keyString = key.toString();
    if (keyString && qualType !== undefined) {
      let final_key = keyString;

      // TBD(WinterPu): for now, just save the duplicated key. need to find the reasons and remove it in the future.
      if (!this.map.has(final_key)) {
        this.map.set(final_key, []);
      } else {
        console.log('ASTNodeMap Duplicate Key', final_key);
      }

      this.map.get(keyString)?.push(qualType);
    }
  }

  get(node: CXXTerraNode): string | undefined {
    // TBD(WinterPu) : not safe here
    let parent_full_scope_name = node.parent_full_scope_name;
    let param_name = node.name;

    // let terra_type = node.__TYPE;
    // let name = node.name;
    // let valKind = STR_UNDEFINED;
    // let valTagUsed = STR_UNDEFINED;

    // switch(terra_type){

    //   case CXXTYPE.Unknown:
    //     break;
    //   case CXXTYPE.CXXFile:
    //     break;
    //   case CXXTYPE.IncludeDirective:
    //     break;
    //   case CXXTYPE.TypeAlias:
    //     break;
    //   case CXXTYPE.Clazz:
    //     valKind = ClangASTNodeKind.CXXRecordDecl;
    //     valTagUsed = 'class';
    //     break;

    //   case CXXTYPE.Struct:
    //     break;
    //   case CXXTYPE.Constructor:
    //     break;
    //   case CXXTYPE.MemberFunction:
    //     break;

    //   case CXXTYPE.Variable:
    //     valKind = ClangASTNodeKind.ParmVarDecl;
    //     valTagUsed = STR_UNDEFINED;
    //     debugger;
    //     break;
    //   case CXXTYPE.SimpleType:
    //     break;
    //   case CXXTYPE.MemberVariable:

    //     break;

    //   case CXXTYPE.EnumConstant:
    //     break;
    //   case CXXTYPE.Enumz:
    //     break;

    //   default:
    //     break;
    // }

    const key = new ASTNodeKey(parent_full_scope_name, param_name).toString();
    return this.map.get(key)?.[0];
  }

  merge(otherMap: ASTNodeMap): void {
    otherMap.map.forEach((value, key) => {
      this.map.set(key, value);
    });
  }
}

// TBD(WinterPu): for now, it just parse a parameter's qual type in a method of a class.
export function ClangASTQualTypeParser(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFiles: string[],
  parseResult: ParseResult
) {
  let qualTypes = parseQualTypes(buildDir, includeHeaderDirs, parseFiles);

  // debugger;

  const qualTypeMap = qualTypes.reduce((acc, item) => {
    acc.merge(item);
    return acc;
  }, new ASTNodeMap());

  parseResult.nodes.forEach((f: any) => {
    let cxxFile = f as CXXFile;

    for (let n of cxxFile.nodes) {
      let node = n as CXXTerraNode;
      if (node.__TYPE == CXXTYPE.Clazz) {
        node.asClazz().methods.map((method, index) => {
          method.return_type.clang_qualtype = qualTypeMap.get(method) ?? '';
          method.parameters.map((parameter, index) => {
            let qualType = qualTypeMap.get(parameter);
            parameter.type.clang_qualtype = qualType ?? '';
          });
        });
      }
    }

    // debugger;
    return;
  });
}

function _parseQualTypes(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFile: string
): ASTNodeMap {
  let astJson = dumpClangASTJSON(buildDir, includeHeaderDirs, parseFile);
  let nodes = filterAndFlattenNodes(parseFile, astJson);
  let mapASTNodeQualType = new ASTNodeMap();

  function collectQualTypeInfos(
    node: any,
    val_parent_full_scope_name: string = ''
  ) {
    // handle ParmVarDecl
    if (node.kind === ClangASTNodeKind.ParmVarDecl) {
      let key = new ASTNodeKey(val_parent_full_scope_name, node.name);
      mapASTNodeQualType.set(key, node.type?.qualType);
    }
    // handle CXXMethodDecl
    if (node.kind === ClangASTNodeKind.CXXMethodDecl) {
      let key = new ASTNodeKey(val_parent_full_scope_name, node.name);
      mapASTNodeQualType.set(key, node.type?.qualType);
    }

    // flatten nodes would save namespace to ns
    // let bIsKind_Namespace = node.kind === ClangASTNodeKind.NamespaceDecl;

    let bIsKind_Class =
      node.kind == ClangASTNodeKind.CXXRecordDecl &&
      node.tagUsed == TagUsedType.class_t;
    let bIsKind_Method = node.kind == ClangASTNodeKind.CXXMethodDecl;

    if (bIsKind_Class || bIsKind_Method) {
      val_parent_full_scope_name = val_parent_full_scope_name
        ? `${val_parent_full_scope_name}::${node.name}`
        : node.name;
    }

    if (node.inner) {
      for (const innerNode of node.inner) {
        let tmp_parent_scope_name = val_parent_full_scope_name;
        collectQualTypeInfos(innerNode, tmp_parent_scope_name);
      }
    }
  }

  for (let n of nodes) {
    let curNode = n.node;
    collectQualTypeInfos(curNode, n.ns);
  }

  return mapASTNodeQualType;
}

function parseQualTypes(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFiles: string[]
): ASTNodeMap[] {
  return parseFiles
    .map((it) => {
      return _parseQualTypes(buildDir, includeHeaderDirs, it);
    })
    .flat(1);
}
