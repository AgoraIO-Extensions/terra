import path from 'path';

import { Command } from 'commander';

import { RendererCommand } from '../commands/renderer_command';

export function run() {
  // Set the app root path to my/path/terra-cli
  // The `__dirname` is /xx/terra/terra-cli/.dist/src/cli
  // setAppRootPath(path.join(__dirname, '..', '..'));

  const program = new Command();

  program
    .name('terra')
    .description('CLI to generate code from one language to another.')
    .version('0.1.0');

  // program.addCommand(new LegacyCommand());
  program.addCommand(new RendererCommand());

  program.parse();
}
