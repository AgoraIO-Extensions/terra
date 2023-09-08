import path from 'path';

import {
  DefaultVisitor,
  ParseConfig,
  resolvePath,
} from '@agoraio-extensions/terra-core';

import { TerraConfigs } from '../base/terra_configs';
import { CLIOptions } from '../cli/cli_options';
import { DumpJsonGenerator } from '../generators/dump_json_generator';
import { RenderableGenerator } from '../generators/renderable_generator';
import { ParsersLoader } from '../parsers/parsers_loader';

import { BaseRenderCommand } from './base_render_command';

export class RendererCommand extends BaseRenderCommand {
  constructor() {
    super();

    this.name('render');
  }

  run(options: any): void {
    let cliOption = CLIOptions.parse(options);
    console.log(`Parsed CLIOptions: \n${JSON.stringify(cliOption)}`);
    let terraConfigs = TerraConfigs.parse(cliOption.config);

    console.log(`Parsed TerraConfigs: \n${JSON.stringify(terraConfigs)}`);

    let defaultVisitor = new DefaultVisitor();
    let parsersLoader = new ParsersLoader();
    if (terraConfigs.include) {
      let includeConfigs = TerraConfigs.parse(terraConfigs.include);
      let includeConfigDir = path.dirname(resolvePath(terraConfigs.include));
      parsersLoader
        .load(
          new ParseConfig(
            includeConfigDir,
            cliOption.outputDir,
            cliOption.cache == true,
            {}
          ),
          includeConfigs.parsers
        )
        .forEach((parser) => {
          defaultVisitor.addParser(parser);
        });
    }

    parsersLoader
      .load(
        new ParseConfig(
          path.dirname(cliOption.config),
          cliOption.outputDir,
          cliOption.cache == true,
          {}
        ),
        terraConfigs.parsers
      )
      .forEach((parser) => {
        defaultVisitor.addParser(parser);
      });

    if (cliOption.dumpAstJson) {
      defaultVisitor.accept(
        new ParseConfig(
          path.dirname(cliOption.config),
          cliOption.outputDir,
          cliOption.cache == true,
          {}
        ),
        new DumpJsonGenerator(cliOption.outputDir)
      );

      return;
    }

    let renderableGenerator: RenderableGenerator = new RenderableGenerator(
      cliOption,
      terraConfigs.renderers
    );
    defaultVisitor.accept(
      new ParseConfig(
        path.dirname(cliOption.config),
        cliOption.outputDir,
        cliOption.cache == true,
        {}
      ),
      renderableGenerator
    );
  }
}
