import { Command } from 'commander';

import { RunCommand } from '../commands/run_command';

export function run() {
  const program = new Command();

  program.name('terra').description('terra CLI.').version('0.1.0');

  program.addCommand(new RunCommand());

  program.parse();
}
