import path from 'path';

import { TerraContext, resolvePath } from '@agoraio-extensions/terra-core';

import { TerraConfigs } from '../base/terra_configs';
import { TerraShell } from '../base/terra_shell';
import { CLIOptions } from '../cli/cli_options';

import { TerraConfigLoader } from '../loader/terra_config_loader';
import { dumpJsonRenderer } from '../renderers/dump_json_renderer';

import { BaseRenderCommand } from './base_render_command';

export class RunCommand extends BaseRenderCommand {
  constructor() {
    super();

    this.name('run');
  }

  run(options: any): void {
    let cliOption = CLIOptions.parse(options);
    console.log(`Parsed CLIOptions: \n${JSON.stringify(cliOption)}`);
    let terraConfigs = TerraConfigs.parse(cliOption.config);

    console.log(`Parsed TerraConfigs: \n${JSON.stringify(terraConfigs)}`);

    let defaultVisitor = new TerraShell();
    let loader = new TerraConfigLoader(cliOption);
    // let parsersLoader = new ParsersLoader();
    if (terraConfigs.include) {
      let includeConfigs = TerraConfigs.parse(terraConfigs.include);
      let includeConfigDir = path.dirname(resolvePath(terraConfigs.include));

      loader
        .loadParsers(
          new TerraContext(
            includeConfigDir,
            cliOption.outputDir,
            cliOption.clean
          ),
          includeConfigs.parsers
        )
        .forEach((parser) => {
          defaultVisitor.addParser(parser);
        });
    }

    loader
      .loadParsers(
        new TerraContext(
          path.dirname(cliOption.config),
          cliOption.outputDir,
          cliOption.clean
        ),
        terraConfigs.parsers
      )
      .forEach((parser) => {
        defaultVisitor.addParser(parser);
      });

    if (cliOption.dumpAstJson) {
      defaultVisitor.addRenderer(
        dumpJsonRenderer(
          new TerraContext(
            path.dirname(cliOption.config),
            cliOption.outputDir,
            cliOption.clean
          )
        )
      );
    } else {
      loader
        .loadRenderers(
          new TerraContext(
            path.dirname(cliOption.config),
            cliOption.outputDir,
            cliOption.clean
          ),
          terraConfigs.renderers
        )
        .forEach((it) => {
          defaultVisitor.addRenderer(it);
        });
    }

    defaultVisitor.run();
  }
}
