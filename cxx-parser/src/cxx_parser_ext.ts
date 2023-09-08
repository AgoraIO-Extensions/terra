import { ParseResult } from "@agoraio-extensions/terra-core";
import { CXXFile, CXXTYPE, Clazz, Enumz } from "./cxx_terra_node";

export {};

declare module "@agoraio-extensions/terra-core" {
  export interface ParseResult {
    /**
     * Find a `Clazz` by its name.
     */
    findClazz(clazzName: string): Clazz | undefined;

    /**
     * Find a `Enumz` by its name.
     */
    findEnumz(enumzName: string): Enumz | undefined;
  }
}

/**
 * Find a `Clazz` by its name.
 */
ParseResult.prototype.findClazz = function (
  clazzName: string
): Clazz | undefined {
  if (clazzName == "") {
    return undefined;
  }

  const clazzNameNamespace = clazzName.getNamespace();
  const trimNamespacesName = clazzName.trimNamespace();

  for (const node of this.nodes) {
    let cxxFile = node as CXXFile;
    for (const node of cxxFile.nodes) {
      if (node.__TYPE == CXXTYPE.Clazz) {
        const clazz = node;

        if (clazz.name == trimNamespacesName) {
          if (
            clazz.getNamespacesInString() == clazzNameNamespace ||
            clazzNameNamespace == "" ||
            clazz.getNamespacesInString().includes(clazzNameNamespace)
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

  for (const n of this.nodes) {
    let cxx_file = n as CXXFile;
    for (const node of cxx_file.nodes) {
      if (node.__TYPE == CXXTYPE.Enumz) {
        const enumz = node as Enumz;

        if (enumz.name === trim_namespaces_name) {
          if (
            enumz.getNamespacesInString() == namespace_string ||
            namespace_string == "" ||
            enumz.getNamespacesInString().includes(namespace_string)
          ) {
            return enumz;
          }
        }
      }
    }
  }

  return undefined;
};
