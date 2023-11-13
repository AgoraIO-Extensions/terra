export * from './path_resolver';
export * from './testing_utils';

/**
 * Abstract representation of a node in terra.
 * This interface serves as a base for node types and can be extended to
 * represent various node-specific details and functionalities within terra.
 */
export interface TerraNode {}

/**
 * Class representing the result of a parsing operation.
 * Contains an array of `TerraNode` objects.
 */
export class ParseResult {
  nodes: TerraNode[] = [];
}

/**
 * Represents the context in which terra operates.
 * Includes various directory paths and configuration flags.
 */
export class TerraContext {
  /**
   * Constructs a new `TerraContext` instance.
   * @param buildDir The build directory path.
   * @param configDir The configuration directory path.
   * @param outputDir The output directory path.
   * @param clean Flag indicating whether to clean the build directory.
   * @param verbose Flag for verbose logging.
   */
  constructor(
    public readonly buildDir: string = '',
    public readonly configDir: string = '',
    public readonly outputDir: string = '',
    public readonly clean: boolean = false,
    public readonly verbose: boolean = false
  ) {}
}

/**
 * Type definition for a Parser function.
 * @param terraContext The `TerraContext` instance.
 * @param args Additional arguments.
 * @param parseResult Optional `ParseResult` instance.
 * @return A `ParseResult` or undefined.
 */
export type Parser = (
  terraContext: TerraContext,
  args: any,
  parseResult?: ParseResult
) => ParseResult | undefined;

/** Interface representing the result of a rendering operation. */
export interface RenderResult {
  file_name: string;
  file_content: string;
}

/**
 * Type definition for a Renderer function.
 * @param terraContext The `TerraContext` instance.
 * @param args Additional arguments.
 * @param parseResult A `ParseResult` instance.
 * @return An array of `RenderResult` objects.
 */
export type Renderer = (
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult
) => RenderResult[];
