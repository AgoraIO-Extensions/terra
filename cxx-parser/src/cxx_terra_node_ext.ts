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
