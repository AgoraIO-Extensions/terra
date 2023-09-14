import path from 'path';

import {
  TerraContext,
  resolvePath,
} from '@agoraio-extensions/terra-core';

import { TerraConfigs } from '../base/terra_configs';
import { CLIOptions } from '../cli/cli_options';

import { BaseRenderCommand } from './base_render_command';
import { TerraConfigLoader } from '../loader/terra_config_loader';
import { TerraShell } from '../base/terra_shell';
import { dumpJsonRenderer } from '../generators/dump_json_renderer';

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

    let defaultVisitor = new TerraShell();
    let loader = new TerraConfigLoader(cliOption);
    // let parsersLoader = new ParsersLoader();
    if (terraConfigs.include) {
      let includeConfigs = TerraConfigs.parse(terraConfigs.include);
      let includeConfigDir = path.dirname(resolvePath(terraConfigs.include));
      // parsersLoader
      //   .load(
      //     new ParseConfig(
      //       includeConfigDir,
      //       cliOption.outputDir,
      //       cliOption.cache == true,
      //       {}
      //     ),
      //     includeConfigs.parsers
      //   )
      //   .forEach((parser) => {
      //     defaultVisitor.addParser(parser);
      //   });

      loader
        .loadParsers(
          new TerraContext(
            includeConfigDir,
            cliOption.outputDir,
            cliOption.cache == true,

          ),
          includeConfigs.parsers
        )
        .forEach((parser) => {
          defaultVisitor.addParser(parser);
        });
    }

    // parsersLoader
    //   .load(
    //     new ParseConfig(
    //       path.dirname(cliOption.config),
    //       cliOption.outputDir,
    //       cliOption.cache == true,
    //       {}
    //     ),
    //     terraConfigs.parsers
    //   )
    //   .forEach((parser) => {
    //     defaultVisitor.addParser(parser);
    //   });

    loader
      .loadParsers(
        new TerraContext(
          path.dirname(cliOption.config),
          cliOption.outputDir,
          cliOption.cache == true,

        ),
        terraConfigs.parsers
      )
      .forEach((parser) => {
        defaultVisitor.addParser(parser);
      });

    if (cliOption.dumpAstJson) {
      // defaultVisitor.accept(
      //   new ParseConfig(
      //     path.dirname(cliOption.config),
      //     cliOption.outputDir,
      //     cliOption.cache == true,
      //     {}
      //   ),
      //   new DumpJsonGenerator(cliOption.outputDir)
      // );

      // defaultVisitor.accept(
      //   new TerraContext(
      //     path.dirname(cliOption.config),
      //     cliOption.outputDir,
      //     cliOption.cache == true,

      //   ),
      //   new DumpJsonGenerator(cliOption.outputDir)
      // );

      defaultVisitor.addRenderer(dumpJsonRenderer(
        new TerraContext(
          path.dirname(cliOption.config),
          cliOption.outputDir,
          cliOption.cache == true,
        ),
      ));
    } else {
      loader.loadRenderers(
        new TerraContext(
          path.dirname(cliOption.config),
          cliOption.outputDir,
          cliOption.cache == true,
        ),
        terraConfigs.renderers,
      ).forEach((it) => {
        defaultVisitor.addRenderer(it);
      });
    }

    defaultVisitor.run();

    // let renderableGenerator: RenderableGenerator = new RenderableGenerator(
    //   cliOption,
    //   terraConfigs.renderers
    // );
    // defaultVisitor.accept(
    //   new ParseConfig(
    //     path.dirname(cliOption.config),
    //     cliOption.outputDir,
    //     cliOption.cache == true,
    //     {}
    //   ),
    //   renderableGenerator
    // );

    // defaultVisitor.accept(
    //   new TerraContext(
    //     path.dirname(cliOption.config),
    //     cliOption.outputDir,
    //     cliOption.cache == true,
    //   ),
    //   renderableGenerator
    // );
  }
}
