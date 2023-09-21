// export * from "./app_root_path";
export * from './path_resolver';

export interface TerraNode {}

export class ParseResult {
  nodes: TerraNode[] = [];
}

export class TerraContext {
  constructor(
    public readonly configDir: string = '',
    public readonly outputDir: string = '',
    public readonly clean: boolean = false,
    public readonly verbose: boolean = false
  ) {}
}

export type Parser = (
  terraContext: TerraContext,
  args: any,
  parseResult?: ParseResult
) => ParseResult | undefined;

export interface RenderResult {
  file_name: string;
  file_content: string;
}

export type Renderer = (
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult
) => RenderResult[];
