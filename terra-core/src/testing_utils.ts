/**
 * Exports a list of functions from the current module for testing purposes when in a test environment.
 *
 * This function dynamically exports the given functions to the specified module's exports, making them
 * available for import in other files. This is particularly useful for exposing functions for
 * testing without making them part of the module's public API.
 *
 * @example
 * // In your-module.ts
 * import { visibleForTesting } from '@agoraio-extensions/terra-core';
 *
 * function privateFunction1() {
 *   // ...
 * }
 *
 * function privateFunction2() {
 *   // ...
 * }
 *
 * visibleForTesting(module, privateFunction1, privateFunction2);
 *
 * // Now privateFunction1 and privateFunction2 can be used from your-module.ts in a test environment.
 *
 * @param {any} module - The module object where the functions will be exported.
 * @param {...Function[]} func - The functions to be exported for testing.
 */
export function visibleForTesting(module: any, ...func: Function[]): void {
  if (process.env.NODE_ENV === 'test') {
    for (let f of func) {
      if (typeof f === 'function' && f.name) {
        (module as any).exports[f.name] = f;
      } else {
        console.error('Invalid function passed to visibleForTesting:', f);
      }
    }
  }
}
