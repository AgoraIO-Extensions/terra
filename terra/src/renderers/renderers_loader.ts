// import path from 'path';
// import fs from 'fs';

// import {
//   ParseResult,
//   RenderResult,
//   Renderer,
//   TerraContext,
// } from '@agoraio-extensions/terra-core';

// import { TerraLoaderConfig } from '../base/terra_configs';
// import { CLIOptions } from '../cli/cli_options';

// // import { DefaultIORenderer } from './default_io_renderer';

// export interface _RendererCallable {
//   // The signature is same as the `Renderer`
//   (terraContext: TerraContext, args: any, parseResult: ParseResult): RenderResult[];
// }

// // export class DefaultIORenderer implements Renderer {
// //   private readonly renderer: Renderer;
// //   private readonly outputDir: string = '';
// //   public constructor(outputDir: string, renderer: Renderer) {
// //     this.outputDir = outputDir;
// //     this.renderer = renderer;
// //   }
// //   render(parseResult: ParseResult): RenderResult[] {
// //     let res = this.renderer.render(parseResult);
// //     res.forEach(({ file_name, file_content }) => {
// //       fs.writeFileSync(path.join(this.outputDir, file_name), file_content);
// //       return file_content;
// //     });

// //     return res;
// //   }
// // }

// function _ioRenderer(delegate: Renderer, outputDir: string): Renderer {
//   return function (terraContext: TerraContext, args: any, parseResult: ParseResult): RenderResult[] {
//     let res = delegate(terraContext, args, parseResult);
//     res.forEach(({ file_name, file_content }) => {
//       fs.writeFileSync(path.join(outputDir, file_name), file_content);
//       return file_content;
//     });

//     return res;
//   }
// }

// function _defaultExportRenderer(delegate: Renderer, args: any): Renderer {
//   return function (terraContext: TerraContext, _: any, parseResult: ParseResult): RenderResult[] {
//     return delegate(terraContext, args, parseResult);
//   }
// }

// // class _DefaultExportRenderer implements _RendererCallable {
// //   private readonly rendererFunc: Renderer;
// //   public constructor(rendererFunc: Renderer) {
// //     this.rendererFunc = rendererFunc;
// //   }

// //   (terraContext: TerraContext, args: any, parseResult: ParseResult): RenderResult[] {
// //     return this.rendererFunc(parseResult);
// //   }
// // }

// export class RenderersLoader {
//   private readonly cliOptions: CLIOptions;

//   constructor(cliOptions: CLIOptions) {
//     this.cliOptions = cliOptions;
//   }

//   /**
//    * Try to create renderer instance given a name and args.
//    * Throw error if the renderer can not be created.
//    */
//   private createRendererUnsafe(
//     config: TerraLoaderConfig
//   ): Renderer | undefined {
//     let instance: Renderer | undefined = undefined;

//     console.assert(config.path !== undefined, `renderer path is undefined`);

//     let p = path.resolve(config.path!);
//     let rr = require(p);

//     instance = _ioRenderer(
//       _defaultExportRenderer(rr.default, config.args),
//       this.cliOptions.outputDir,
//       // new _DefaultExportRenderer(rr.default)
//     );

//     return instance;
//   }

//   load(renderers: Array<TerraLoaderConfig>): Renderer[] {
//     let parsedRenderers = renderers.map((r) => {
//       return this.createRendererUnsafe(r)!;
//     });

//     return parsedRenderers;
//   }
// }
