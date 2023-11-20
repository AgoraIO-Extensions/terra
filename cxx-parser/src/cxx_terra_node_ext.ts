import { strict as assert } from 'assert';

import { SimpleType, SimpleTypeKind } from './cxx_terra_node';

export {};

declare global {
  export interface String {
    /**
     * This function removes the namespace from a fully qualified name.
     * For example, "foo::bar" becomes "bar".
     */
    trimNamespace(): string;

    /**
     * Returns the namespace of the class name.
     *
     * Example: "std::vector::size_type" returns "std::vector"
     */
    getNamespace(): string;
  }
}

declare module '@agoraio-extensions/cxx-parser' {
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

  let regex = new RegExp(/\d+/);
  let len = this.source.match(regex);
  if (len) {
    return len[0];
  }

  assert(false); // Should not reach here
};
