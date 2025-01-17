import {
  TagUsedType,
  ClangASTNodeKind,
  _FlattenNode,
  dumpClangASTJSON,
  filterAndFlattenNodes,
} from './utils'

import { ParseResult, visibleForTesting } from '@agoraio-extensions/terra-core';

import { generateChecksum, getCppAstBackendDir } from './cxx_parser';
import {
  CXXFile,
  CXXTYPE,
  Constructor,
  ConstructorInitializer,
  ConstructorInitializerKind,
  SimpleType,
  Struct,
} from './cxx_terra_node';

/**
 * Intermediate objects used internally
 */
interface _NameValueTypeHolder {
  kind: ConstructorInitializerKind;
  name: string;
  type: string;
  values: string[];
}

/**
 * Intermediate objects used internally
 */
class _ConstructorInitializer {
  name: string = '';
  signature: string = '';
  parameterList: _NameValueTypeHolder[] = [];
  initializerList: _NameValueTypeHolder[] = [];
}

/**
 * Intermediate objects used internally
 */
class _StructConstructors {
  name: string = '';
  constructors: _ConstructorInitializer[] = [];
}


function _parseStructConstructors(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFile: string
): _StructConstructors[] {
  let astJson = dumpClangASTJSON(buildDir, includeHeaderDirs, parseFile);
  let nodes = filterAndFlattenNodes(parseFile, astJson);

  // Find all `CXXRecordDecl` nodes in "struct" tag
  let allStructs = nodes.filter((node: _FlattenNode) => {
    return (
      node.node.kind == ClangASTNodeKind.CXXRecordDecl &&
      node.node.tagUsed == TagUsedType.struct_t
    );
  });

  let _structConstructors: _StructConstructors[] = [];

  for (let s of allStructs) {
    let structConstructor: _StructConstructors = {} as _StructConstructors;
    structConstructor.name = s.ns ? `${s.ns}::${s.node.name}` : s.node.name;

    // If only declare the struct with name, e.g.,
    // ```c++
    // struct EncodedVideoFrameInfo;
    // ```
    // There's no `s.node.inner` of it, skip it.
    if (!s.node.inner) {
      continue;
    }

    // Find all `CXXConstructorDecl` nodes in `cxxRecordDecls`'s `inner`
    let cxxConstructorDecls = s.node.inner.filter((node: any) => {
      return (
        node.kind == ClangASTNodeKind.CXXConstructorDecl &&
        !node.isImplicit /* filter the implicited generated constructors */
      );
    });

    let constructorInitializers: _ConstructorInitializer[] = [];

    for (let cxxConstructorDecl of cxxConstructorDecls) {
      let constructorInitializer = new _ConstructorInitializer();
      constructorInitializer.name = cxxConstructorDecl.name;
      constructorInitializer.signature = cxxConstructorDecl.type.qualType;

      // If the constructor is explicitly defaulted, skip it. e.g.,
      // ```c++
      //struct RemoteVoicePositionInfo {
      //   RemoteVoicePositionInfo() = default;
      // };
      // ```
      if (!cxxConstructorDecl.inner) {
        continue;
      }

      // Find all `ParmVarDecl` nodes in `cxxConstructorDecl`'s `inner`
      let parmVarDecls = cxxConstructorDecl.inner.filter((node: any) => {
        return node.kind == ClangASTNodeKind.ParmVarDecl;
      });
      parmVarDecls.forEach((parmVarDecl: any) => {
        let nameValueTypeHolder = {} as _NameValueTypeHolder;
        nameValueTypeHolder.kind = ConstructorInitializerKind.Parameter;
        nameValueTypeHolder.name = parmVarDecl.name;
        nameValueTypeHolder.type = parmVarDecl.type.qualType;
        // TODO(littlegnal): Maybe parse the default value
        nameValueTypeHolder.values = [parmVarDecl.name];
        constructorInitializer.parameterList.push(nameValueTypeHolder);
      });

      // Find all `CXXCtorInitializer` nodes in `cxxConstructorDecl`'s `inner`
      let cxxCtorInitializers = cxxConstructorDecl.inner.filter((node: any) => {
        return node.kind == ClangASTNodeKind.CXXCtorInitializer;
      });
      cxxCtorInitializers.forEach((cxxCtorInitializer: any) => {
        let nameValueTypeHolder = {} as _NameValueTypeHolder;
        const [kind, values] = parseInnerValues(cxxCtorInitializer.inner);

        nameValueTypeHolder.kind = parseConstructorInitializerKind(
          cxxCtorInitializer.kind,
          kind
        );
        nameValueTypeHolder.name = cxxCtorInitializer.anyInit.name;
        nameValueTypeHolder.type = cxxCtorInitializer.anyInit.type.qualType;
        nameValueTypeHolder.values = values;
        constructorInitializer.initializerList.push(nameValueTypeHolder);
      });

      constructorInitializers.push(constructorInitializer);
    }

    structConstructor.constructors = constructorInitializers;

    _structConstructors.push(structConstructor);
  }

  return _structConstructors;
}

function parseStructConstructors(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFiles: string[]
): _StructConstructors[] {
  return parseFiles
    .map((it) => {
      return _parseStructConstructors(buildDir, includeHeaderDirs, it);
    })
    .flat(1);
}

function parseConstructorInitializerKind(
  kind: string,
  valueKind: ConstructorInitializerKind
) {
  switch (kind) {
    case ClangASTNodeKind.CXXConstructExpr:
      return ConstructorInitializerKind.Construct;
    default:
      return valueKind;
  }
}

function parseReferencedDeclValue(
  referencedDecl: any
): [ConstructorInitializerKind, string] {
  let kind = ConstructorInitializerKind.Value;
  switch (referencedDecl.kind) {
    case ClangASTNodeKind.EnumConstantDecl:
      // e.g.,
      // "referencedDecl": {
      //     "id": "0x7fe0510ca138",
      //     "kind": "EnumConstantDecl",
      //     "name": "RENDER_MODE_HIDDEN",
      //     "type": {
      //       "qualType": "agora::media::base::RENDER_MODE_TYPE"
      //     }
      //   }
      return [kind, `${referencedDecl.type.qualType}::${referencedDecl.name}`];
    case ClangASTNodeKind.ParmVarDecl:
      // e.g.,
      // "referencedDecl": {
      //     "id": "0x7fe0549e5218",
      //     "kind": "ParmVarDecl",
      //     "name": "v",
      //     "type": {
      //       "desugaredQualType": "void *",
      //       "qualType": "agora::view_t",
      //       "typeAliasDeclId": "0x7fe0505c0de8"
      //     }
      //   }
      kind = ConstructorInitializerKind.Parameter;
      return [kind, referencedDecl.name];
    default:
      return [kind, referencedDecl.name];
  }
}

// Parse the values of the `inner` nodes
function parseInnerValues(inner: any): [ConstructorInitializerKind, string[]] {
  let values: string[] = [];
  let kind = ConstructorInitializerKind.Value;

  let nodes = inner;
  for (let node of nodes) {
    switch (node.kind) {
      case ClangASTNodeKind.CXXBoolLiteralExpr:
      case ClangASTNodeKind.IntegerLiteral:
      // The `float/double` is `FloatingLiteral`
      // TODO(littlegnal): The float value `0.0` is returned `0`, maybe substring the float/double value
      // from the source, so we can get the exact value of the source.
      case ClangASTNodeKind.FloatingLiteral:
        // Get the value from `value` field
        values.push(`${node.value}`);
        break;
      case ClangASTNodeKind.ImplicitCastExpr: {
        let [k, vs] = parseInnerValues(node.inner);
        kind = k;
        values.push(...vs);
        break;
      }
      case ClangASTNodeKind.GNUNullExpr:
        values.push('NULL');
        break;
      case ClangASTNodeKind.CXXNullPtrLiteralExpr:
        // std::nullptr_t
        values.push('std::nullptr_t');
        break;
      case ClangASTNodeKind.DeclRefExpr: {
        // e.g.,
        // "referencedDecl": {
        //     "id": "0x7fe0510ca138",
        //     "kind": "EnumConstantDecl",
        //     "name": "RENDER_MODE_HIDDEN",
        //     "type": {
        //       "qualType": "agora::media::base::RENDER_MODE_TYPE"
        //     }
        //   }
        //
        // "referencedDecl": {
        //     "id": "0x7fe0549e5218",
        //     "kind": "ParmVarDecl",
        //     "name": "v",
        //     "type": {
        //       "desugaredQualType": "void *",
        //       "qualType": "agora::view_t",
        //       "typeAliasDeclId": "0x7fe0505c0de8"
        //     }
        //   }
        const [k, v] = parseReferencedDeclValue(node.referencedDecl);
        kind = k;
        values.push(v);
        break;
      }
      case ClangASTNodeKind.UnaryOperator: {
        let opcode = node.opcode;
        let [_, vs] = parseInnerValues(node.inner);
        let finalV = `${opcode}${vs[0]}`;
        values.push(finalV);
        break;
      }
      case ClangASTNodeKind.CXXConstructExpr: {
        if (!node.isImplicit && node.inner) {
          const [_, v] = parseInnerValues(node.inner);
          kind = ConstructorInitializerKind.Construct;
          values.push(...v);
        }

        break;
      }
      default:
        break;
    }
  }

  return [kind, values];
}

export function ClangASTStructConstructorParser(
  buildDir: string,
  includeHeaderDirs: string[],
  parseFiles: string[],
  parseResult: ParseResult
) {
  function _signature(constructor: Constructor): string {
    let parameterTypeList = constructor.parameters
      .map((it) => {
        function _type2String(type: SimpleType): string {
          if (type.namespaces?.length > 0) {
            return `${type.namespace}::${type.realName}`;
          }
          return type.name;
        }
        return _type2String(it.type);
      })
      .join(', ');

    return `void (${parameterTypeList})`;
  }

  let constructorInitializers = parseStructConstructors(
    buildDir,
    includeHeaderDirs,
    parseFiles
  );
  let constructorInitializersMap = constructorInitializers.reduce(
    (acc, item) => acc.set(item.name, item),
    new Map<string, _StructConstructors>()
  );

  parseResult.nodes.forEach((f: any) => {
    let cxxFile = f as CXXFile;

    for (let n of cxxFile.nodes) {
      if (n.__TYPE == CXXTYPE.Struct) {
        let node = n as Struct;
        let fullName = node.fullName;
        let structConstructor = constructorInitializersMap.get(fullName);
        if (!structConstructor) {
          continue;
        }

        for (let c of node.constructors) {
          let constructorSignature = _signature(c);

          let foundStructConstructor = structConstructor?.constructors.find(
            (it) => {
              return it.signature == constructorSignature;
            }
          );

          if (foundStructConstructor) {
            let initializerList = foundStructConstructor.initializerList.map(
              (it) => {
                let ci = new ConstructorInitializer();
                ci.kind = it.kind;
                ci.name = it.name;
                ci.type = it.type;
                ci.values = it.values;

                return ci;
              }
            );

            c.initializerList = initializerList;
          }
        }
      }
    }
  });
}

// Add functions that visible for testing here.
visibleForTesting(module, parseStructConstructors);
