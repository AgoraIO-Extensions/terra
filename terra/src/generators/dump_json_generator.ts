// import * as fs from 'fs';
// import path from 'path';

// import { Generator, ParseResult } from '@agoraio-extensions/terra-core';

// export const terraAstJsonFileName = 'terra_ast.json';

// export class DumpJsonGenerator implements Generator {
//   private readonly outputDir: string = '';

//   public constructor(outputDir: string) {
//     this.outputDir = outputDir;
//   }

//   generate(parseResult: ParseResult): boolean {
//     if (this.outputDir != '') {
//       let outputJson = JSON.stringify(parseResult.nodes);
//       let outputFilePath = path.join(this.outputDir, terraAstJsonFileName);
//       fs.writeFileSync(outputFilePath, outputJson);
//       console.log('terra ast json has dumped to: ' + outputFilePath);
//     }
//     return true;
//   }
// }
