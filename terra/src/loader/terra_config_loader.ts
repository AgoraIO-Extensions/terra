import fs from 'fs';
import path from 'path';

import {
  ParseResult,
  Parser,
  RenderResult,
  Renderer,
  TerraContext,
  requireModule,
} from '@agoraio-extensions/terra-core';

import { TerraLoaderConfig } from '../base/terra_configs';
import { CLIOptions } from '../cli/cli_options';

export function resolveTerraLoaderConfig(
  terraConfigDir: string,
  config: TerraLoaderConfig
): any {
  let instance: any;

  console.assert(
    !(config.path && config.package),
    'Not supported set both path and pacakge!'
  );
  console.assert(
    !(!config.path && !config.package),
    'Not set the path or package!'
  );

  if (config.path) {
    let p = path.join(path.dirname(terraConfigDir), config.path!);
    let loaded = require(p);
    if (config.name) {
      // export named function
      instance = loaded[config.name!];
    } else {
      // export default function
      instance = loaded.default;
    }
  }

  if (config.package) {
    let loaded = requireModule(config.package!);
    if (config.name) {
      // export named function
      instance = loaded[config.name!];
    } else {
      // export default function
      instance = loaded.default;
    }
  }

  return instance;
}

function _ioRendererWrapper(
  delegate: Renderer,
  terraContext: TerraContext,
  args: any
): Renderer {
  return function (
    _: TerraContext,
    __: any,
    parseResult: ParseResult
  ): RenderResult[] {
    let res = delegate(terraContext, args, parseResult);
    res.forEach(({ file_name, file_content }) => {
      fs.writeFileSync(
        path.join(terraContext.outputDir, file_name),
        file_content
      );
      return file_content;
    });

    return res;
  };
}

function _parserWrapper(
  delegate: Parser,
  terraContext: TerraContext,
  args: any
): Parser {
  return function (
    _: TerraContext,
    __: any,
    parseResult?: ParseResult
  ): ParseResult | undefined {
    return delegate(terraContext, args, parseResult);
  };
}

export class TerraConfigLoader {
  private readonly cliOptions: CLIOptions;

  constructor(cliOptions: CLIOptions) {
    this.cliOptions = cliOptions;
  }

  loadParsers(
    terraContext: TerraContext,
    parsers: Array<TerraLoaderConfig>
  ): Parser[] {
    let parsedParsers = parsers.map((it) => {
      return _parserWrapper(
        resolveTerraLoaderConfig(this.cliOptions.config, it),
        terraContext,
        it.args
      );
    });

    return parsedParsers;
  }

  loadRenderers(
    terraContext: TerraContext,
    renderers: Array<TerraLoaderConfig>
  ) {
    let parsedRenderers = renderers.map((it) => {
      return _ioRendererWrapper(
        resolveTerraLoaderConfig(this.cliOptions.config, it),
        terraContext,
        it.args
      );
    });

    return parsedRenderers;
  }
}
