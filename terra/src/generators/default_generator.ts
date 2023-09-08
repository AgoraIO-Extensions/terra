import { Generator, ParseResult } from '@agoraio-extensions/terra-core';

export class DefaultGenerator implements Generator {
  generate(parseResult: ParseResult): boolean {
    // Do nothing at this time.
    console.log(parseResult);
    return true;
  }
}
