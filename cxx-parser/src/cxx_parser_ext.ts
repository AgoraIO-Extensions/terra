import './cxx_terra_node_string_ext';

import { ParseResult } from '@agoraio-extensions/terra-core';

import {
  CXXFile,
  CXXTYPE,
  CXXTerraNode,
  Clazz,
  Enumz,
  SimpleType,
  SimpleTypeKind,
} from './cxx_terra_node';

export {};

declare module '@agoraio-extensions/terra-core' {
  export interface ParseResult {
    /**
     * Find a `Clazz` by its name.
     * @deprecated Use `resolveNodeByType` instead.
     */
    findClazz(clazzName: string): Clazz | undefined;

    /**
     * Find a `Enumz` by its name.
     * @deprecated Use `resolveNodeByType` instead.
     */
    findEnumz(enumzName: string): Enumz | undefined;

    /**
     * Resolves a `CXXTerraNode` based on the given `SimpleType`. If none is found, the `SimpleType` is returned.
     *
     * @param type - The `SimpleType` to resolve.
     * @returns The resolved `CXXTerraNode`.
     */
    resolveNodeByType(type: SimpleType): CXXTerraNode;
  }
}

/**
 * Find a `Clazz` by its name.
 */
ParseResult.prototype.findClazz = function (
  clazzName: string
): Clazz | undefined {
  if (clazzName == '') {
    return undefined;
  }

  const clazzNameNamespace = clazzName.getNamespace();
  const trimNamespacesName = clazzName.trimNamespace();

  for (const f of this.nodes) {
    let cxxFile = f as CXXFile;
    for (const node of cxxFile.nodes) {
      if (node.__TYPE == CXXTYPE.Clazz) {
        const clazz = node;

        if (clazz.name == trimNamespacesName) {
          if (
            clazz.namespace == clazzNameNamespace ||
            clazzNameNamespace == '' ||
            clazz.namespace.includes(clazzNameNamespace)
          ) {
            return clazz as Clazz;
          }
        }
      }
    }
  }

  return undefined;
};

/**
 * Find a `Enumz` by its name.
 */
ParseResult.prototype.findEnumz = function (
  enumzName: string
): Enumz | undefined {
  if (enumzName.length === 0) {
    return undefined;
  }

  const namespace_string = enumzName.getNamespace();

  const trim_namespaces_name = enumzName.trimNamespace();

  for (const f of this.nodes) {
    let cxxFile = f as CXXFile;
    for (const node of cxxFile.nodes) {
      if (node.__TYPE == CXXTYPE.Enumz) {
        const enumz = node as Enumz;

        if (enumz.name === trim_namespaces_name) {
          if (
            enumz.namespace == namespace_string ||
            namespace_string == '' ||
            enumz.namespace.includes(namespace_string)
          ) {
            return enumz;
          }
        }
      }
    }
  }

  return undefined;
};

/**
 * Resolves a `CXXTerraNode` based on the given `SimpleType`. If none is found, the `SimpleType` is returned.
 *
 * @param type - The `SimpleType` to resolve.
 * @returns The resolved `CXXTerraNode`.
 */
ParseResult.prototype.resolveNodeByType = function (
  type: SimpleType
): CXXTerraNode {
  function _match(ns: string, namespace_string: string): boolean {
    return (
      ns == namespace_string ||
      namespace_string == '' ||
      ns.includes(namespace_string)
    );
  }
  let name = type.name;
  if (name.length === 0) {
    return type;
  }

  if (type.is_builtin_type) {
    return type;
  }

  if (
    type.kind == SimpleTypeKind.template_t &&
    type.template_arguments.length
  ) {
    // Only support the first template argument at this time
    name = type.template_arguments[0];
  }

  const namespaceInString = name.getNamespace();
  const nameWithoutNS = name.trimNamespace();

  for (const f of this.nodes) {
    let cxxFile = f as CXXFile;
    for (const node of cxxFile.nodes) {
      if (node.name === nameWithoutNS) {
        let ns = node.namespaces.join('::');
        let found = _match(ns, namespaceInString);
        if (!found && node.parent_name) {
          ns = [...node.namespaces, node.parent_name].join('::');
          found = _match(ns, namespaceInString);
        }

        if (found) {
          return node;
        }
      }
    }
  }

  return type;
};
