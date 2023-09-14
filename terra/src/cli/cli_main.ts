import path from 'path';

import { Command } from 'commander';

import { RunCommand } from '../commands/run_command';

export function run() {
  // Set the app root path to my/path/terra-cli
  // The `__dirname` is /xx/terra/terra-cli/.dist/src/cli
  // setAppRootPath(path.join(__dirname, '..', '..'));

  const program = new Command();

  program
    .name('terra')
    .description('terra CLI.')
    .version('0.1.0');

  // program.addCommand(new LegacyCommand());
  program.addCommand(new RunCommand());

  program.parse();
}
