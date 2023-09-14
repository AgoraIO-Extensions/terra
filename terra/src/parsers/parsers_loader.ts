// import { assert } from 'console';

// import {
//   Parser,
//   requireModule,
// } from '@agoraio-extensions/terra-core';

// import { TerraLoaderConfig } from '../base/terra_configs';

// export class ParsersLoader {
//   private createParserUnsafe(
//     parseConfig: ParseConfig,
//     p: TerraLoaderConfig
//   ): Parser {
//     let instance: Parser | undefined = undefined;

//     let argObj = p.args;

//     const parsers = requireModule(p.package!);
//     instance = new parsers[p.name!](parseConfig, argObj);

//     assert(instance !== undefined, `can not create parser: ${p.name}`);

//     return instance!;
//   }

//   load(parseConfig: ParseConfig, parsers: Array<TerraLoaderConfig>): Parser[] {
//     let parsedParsers = parsers.map((it) => {
//       return this.createParserUnsafe(parseConfig, it)!;
//     });

//     return parsedParsers;
//   }
// }
