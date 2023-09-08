import { Command } from 'commander';

export type BaseCommandOptions = any;

export abstract class BaseCommand extends Command {
  constructor() {
    super();

    this.action((options) => {
      this.run(options);
    });
  }

  abstract run(options: BaseCommandOptions): void;
}
