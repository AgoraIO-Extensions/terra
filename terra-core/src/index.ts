export * from './path_resolver';
export * from './testing_utils';

/**
 * Abstract representation of a AST node in terra.
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
   * @param usePrebuilt Flag whether to use the prebuilt cppast_backend.
   * @param verbose Flag for verbose logging.
   */
  constructor(
    public readonly buildDir: string = '',
    public readonly configDir: string = '',
    public readonly outputDir: string = '',
    public readonly clean: boolean = false,
    public readonly usePrebuilt: boolean = true,
    public readonly verbose: boolean = false
  ) {}
}

/**
 * Type definition for a Parser function in terra.
 * Transforms source code into AST nodes (TerraNode).
 * This `Parser` can be part of a chain, where each `Parser` has the ability
 * to modify the results of its predecessor before passing them to the next `Parser`.
 *
 * @param terraContext The `TerraContext` instance, providing operational context.
 * @param args Additional arguments or data for parsing.
 * @param parseResult An optional initial `ParseResult` from a previous Parser in the chain.
 * @returns A new or modified `ParseResult` to be used by subsequent Parsers.
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
 * Type definition for a Renderer function in Terra.
 * Processes the results obtained from a Parser.
 * Use this Renderer to generate code or other forms of output based on the parsed AST nodes (TerraNode).
 *
 * @param terraContext The `TerraContext` instance, providing the operational context.
 * @param args Additional arguments relevant to the rendering process.
 * @param parseResult The `ParseResult` instance containing the Parser's output.
 * @returns An array of `RenderResult` objects, representing the rendered output.
 */
export type Renderer = (
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult
) => RenderResult[];
