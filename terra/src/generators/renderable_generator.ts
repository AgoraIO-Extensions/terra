// import {
//   Generator,
//   ParseResult,
//   Renderer,
// } from '@agoraio-extensions/terra-core';

// import { TerraLoaderConfig } from '../base/terra_configs';
// import { CLIOptions } from '../cli/cli_options';

// import { RenderersLoader } from '../renderers/renderers_loader';

// export class RenderableGenerator implements Generator {
//   private readonly cliOptions: CLIOptions;
//   private readonly renderers: Array<TerraLoaderConfig>;

//   constructor(cliOptions: CLIOptions, renderers: any) {
//     this.cliOptions = cliOptions;
//     this.renderers = renderers;
//   }

//   generate(parseResult: ParseResult): boolean {
//     let renderersLoader = new RenderersLoader(this.cliOptions);

//     let loadedRenderers: Renderer[] = renderersLoader.load(this.renderers);

//     loadedRenderers.forEach((it) => {
//       it.render(parseResult);
//     });

//     return true;
//   }
// }
