// import fs from 'fs';
// import path from 'path';

// import {
//   ParseResult,
//   RenderResult,
//   Renderer,
// } from '@agoraio-extensions/terra-core';

// export class DefaultIORenderer implements Renderer {
//   private readonly renderer: Renderer;
//   private readonly outputDir: string = '';
//   public constructor(outputDir: string, renderer: Renderer) {
//     this.outputDir = outputDir;
//     this.renderer = renderer;
//   }
//   render(parseResult: ParseResult): RenderResult[] {
//     let res = this.renderer.render(parseResult);
//     res.forEach(({ file_name, file_content }) => {
//       fs.writeFileSync(path.join(this.outputDir, file_name), file_content);
//       return file_content;
//     });

//     return res;
//   }
// }
