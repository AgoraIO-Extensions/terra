import { Option } from 'commander';

import { BaseCommand } from '../base/base_command';

export abstract class BaseRenderCommand extends BaseCommand {
  constructor() {
    super();

    this.addOption(
      new Option(
        '--config, --config <string>',
        'The terra-cli yaml config file path, e.g., terra-config.yaml'
      )
    );
    this.addOption(
      new Option('--output-dir, --output-dir <string>', 'The output directory')
    );
    this.addOption(new Option('-c, --cache [type]', 'use cache dump'));
    this.addOption(
      new Option(
        '-d, --dump-ast-json',
        "Dump terra ast into json format, output as 'terra_ast.json' file."
      )
    );
  }
}
