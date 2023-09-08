import path from 'path';

import {
  ParseResult,
  RenderFunction,
  RenderResult,
  Renderer,
} from '@agoraio-extensions/terra-core';

import { TerraLoaderConfig } from '../base/terra_configs';
import { CLIOptions } from '../cli/cli_options';

import { DefaultIORenderer } from './default_io_renderer';

class _DefaultExportRenderer implements Renderer {
  private readonly rendererFunc: RenderFunction;
  public constructor(rendererFunc: RenderFunction) {
    this.rendererFunc = rendererFunc;
  }

  render(parseResult: ParseResult): RenderResult[] {
    return this.rendererFunc(parseResult);
  }
}

export class RenderersLoader {
  private readonly cliOptions: CLIOptions;

  constructor(cliOptions: CLIOptions) {
    this.cliOptions = cliOptions;
  }

  /**
   * Try to create renderer instance given a name and args.
   * Throw error if the renderer can not be created.
   */
  private createRendererUnsafe(
    config: TerraLoaderConfig
  ): Renderer | undefined {
    let instance: Renderer | undefined = undefined;

    console.assert(config.path !== undefined, `renderer path is undefined`);

    let p = path.resolve(config.path!);
    let rr = require(p);

    instance = new DefaultIORenderer(
      this.cliOptions.outputDir,
      new _DefaultExportRenderer(rr.default)
    );

    return instance;
  }

  load(renderers: Array<TerraLoaderConfig>): Renderer[] {
    let parsedRenderers = renderers.map((r) => {
      return this.createRendererUnsafe(r)!;
    });

    return parsedRenderers;
  }
}
