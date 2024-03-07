import { strict as assert } from 'assert';

import {
  CXXTYPE,
  CXXTerraNode,
  SimpleType,
  SimpleTypeKind,
} from './cxx_terra_node';

export {};

declare module '@agoraio-extensions/cxx-parser' {
  export interface CXXTerraNode {
    /**
     * Checks if this node is a `CXXFile`.
     */
    isCXXFile(): boolean;

    /**
     * Checks if this node is an `IncludeDirective`.
     */
    isIncludeDirective(): boolean;

    /**
     * Checks if this node is a `TypeAlias`.
     */
    isTypeAlias(): boolean;

    /**
     * Checks if this node is a `Clazz`.
     */
    isClazz(): boolean;

    /**
     * Checks if this node is a `Struct`.
     */
    isStruct(): boolean;

    /**
     * Checks if this node is a `Constructor`.
     */
    isConstructor(): boolean;

    /**
     * Checks if this node is a `MemberFunction`.
     */
    isMemberFunction(): boolean;

    /**
     * Checks if this node is a `Variable`.
     */
    isVariable(): boolean;

    /**
     * Checks if this node is a `SimpleType`.
     */
    isSimpleType(): boolean;

    /**
     * Checks if this node is a `MemberVariable`.
     */
    isMemberVariable(): boolean;

    /**
     * Checks if this node is a `EnumConstant`.
     */
    isEnumConstant(): boolean;

    /**
     * Checks if this node is a `Enumz`.
     */
    isEnumz(): boolean;
  }

  export interface SimpleType {
    /**
     * The length of the array type. For example, "int[10]" returns "10".
     */
    lenOfArrayType(): string;
  }
}

/**
 * This function removes the namespace from a fully qualified name.
 * For example, "foo::bar" becomes "bar".
 */
String.prototype.trimNamespace = function (): string {
  if (this.length === 0) {
    return '';
  }

  if (!this.includes('::')) {
    return this as string;
  }

  const splitted = this.split('::');
  return splitted[splitted.length - 1];
};

/**
 * Returns the namespace of the class name.
 *
 * Example: "std::vector::size_type" returns "std::vector"
 */
String.prototype.getNamespace = function (): string {
  if (this.length === 0) {
    return '';
  }

  if (!this.includes('::')) {
    return '';
  }

  const splitted = this.split('::');
  return Array.from(splitted.slice(0, splitted.length - 1)).join('::');
};

/**
 * The length of the array type. For example, "int[10]" returns "10".
 */
SimpleType.prototype.lenOfArrayType = function (): string {
  assert(this.kind === SimpleTypeKind.array_t);
  assert(this.source);

  // Match the `[*]` instead of match the number directly, to avoid matching the number from the std type.
  // e.g., `uint8_t[10]` will match the 8 from `uint8_t`.
  let regex = new RegExp(/\[\d+\]/);
  let len = this.source.match(regex);
  if (len) {
    return len[0].replace('[', '').replace(']', '');
  }

  assert(false); // Should not reach here
};

CXXTerraNode.prototype.isCXXFile = function (): boolean {
  return this.__TYPE === CXXTYPE.CXXFile;
};

CXXTerraNode.prototype.isIncludeDirective = function (): boolean {
  return this.__TYPE === CXXTYPE.IncludeDirective;
};

CXXTerraNode.prototype.isTypeAlias = function (): boolean {
  return this.__TYPE === CXXTYPE.TypeAlias;
};

CXXTerraNode.prototype.isClazz = function (): boolean {
  return this.__TYPE === CXXTYPE.Clazz;
};

CXXTerraNode.prototype.isStruct = function (): boolean {
  return this.__TYPE === CXXTYPE.Struct;
};

CXXTerraNode.prototype.isConstructor = function (): boolean {
  return this.__TYPE === CXXTYPE.Constructor;
};

CXXTerraNode.prototype.isMemberFunction = function (): boolean {
  return this.__TYPE === CXXTYPE.MemberFunction;
};

CXXTerraNode.prototype.isVariable = function (): boolean {
  return this.__TYPE === CXXTYPE.Variable;
};

CXXTerraNode.prototype.isSimpleType = function (): boolean {
  return this.__TYPE === CXXTYPE.SimpleType;
};

CXXTerraNode.prototype.isMemberVariable = function (): boolean {
  return this.__TYPE === CXXTYPE.MemberVariable;
};

CXXTerraNode.prototype.isEnumConstant = function (): boolean {
  return this.__TYPE === CXXTYPE.EnumConstant;
};

CXXTerraNode.prototype.isEnumz = function (): boolean {
  return this.__TYPE === CXXTYPE.Enumz;
};
