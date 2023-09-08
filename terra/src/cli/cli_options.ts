import { BaseCommandOptions } from '../base/base_command';

export class CLIOptions {
  constructor(
    public readonly config: string,
    public readonly outputDir: string,
    public readonly cache: string | boolean = false,
    public readonly dumpAstJson: boolean = false
  ) {}

  static parse(options: BaseCommandOptions): CLIOptions {
    return new CLIOptions(
      options.config,
      options.outputDir,
      options.cache,
      options.dumpAstJson
    );
  }

  public parseFlag(flag: string | boolean): boolean {
    if (typeof flag === 'string') {
      return flag === 'true';
    }
    return flag;
  }
}
