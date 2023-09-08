export {};

declare global {
  export interface String {
    /**
     * This function removes the specified delimiter from the start and end of a string
     * @param delimiter The delimiter to remove
     * @returns The string with the delimiter removed from the start and end
     */
    trimWith(delimiter: string): string;
  }
}

/**
 * This function removes the specified delimiter from the start and end of a string
 * @param delimiter The delimiter to remove
 * @returns The string with the delimiter removed from the start and end
 */
String.prototype.trimWith = function (delimiter: string): string {
  if (delimiter.length === 0) {
    return '';
  }

  var pattern = `^${delimiter}|${delimiter}$`,
    re = new RegExp(pattern, 'g');

  return this.replace(re, '');
};
