// export * from "./app_root_path";
export * from "./path_resolver";

export interface TerraNode {}

export class ParseResult {
  nodes: TerraNode[] = [];
}

export interface Generator {
  generate(parseResult: ParseResult): boolean;
}

export class ParseConfig {
  constructor(
    public readonly configDir: string = "",
    public readonly outputDir: string = "",
    public readonly cache: boolean = false,
    public readonly userData: any
  ) {}
}

export abstract class Parser {
  constructor(parseConfig: ParseConfig) {}

  abstract parse(preParseResult?: ParseResult): ParseResult | undefined;
}

// TODO(littlegnal): Maybe rename to chain
// export class DefaultVisitor<T extends Parser> {
//     private rootParser: Parser;
//     private parsers: Parser[];

//     constructor(rootParser: T) {
//         this.parsers = [];
//         this.rootParser = rootParser;
//         this.parsers.push(this.rootParser);
//     }

//     addParser(parser: Parser) {
//         this.parsers.push(parser);
//     }

//     accept(parseConfig: ParseConfig, generator: Generator) {
//         var parseResult: ParseResult = new ParseResult();
//         for (let parser of this.parsers) {
//             let tmp = parser.parse(parseConfig, parseResult);
//             if (tmp) {
//                 parseResult = tmp;
//             }
//         }

//         generator.generate(parseResult);
//     }
// }

export interface Renderer {
  render(parseResult: ParseResult): RenderResult[];
}

export interface RenderResult {
  file_name: string;
  file_content: string;
}

/**
 * The entry function signature of the `ScriptRenderer`, you can export the entry function as follows, e.g.,
 *
 * - Export as default function directly, the function signature should be the same as the `RenderFunction`
 * ```typescript
 * export default function YourRenderer (cxxFiles: CXXFile[], context: RenderContext): RenderResult [] {
 *    return [];
 * }
 * ```
 *
 *  - Define the entry function as a parameter and export it
 * ```typescript
 * var YourRenderer: RenderFunction = function(cxxFiles: CXXFile[], context: RenderContext): RenderResult [] {
 *   return [];
 * }
 * export default YourRenderer;
 * ```
 */
export type RenderFunction = (parseResult: ParseResult) => RenderResult[];

export class DefaultVisitor {
  private parsers: Parser[];

  // constructor(rootParser: T) {
  //     this.parsers = [];
  //     this.rootParser = rootParser;
  //     this.parsers.push(this.rootParser);
  // }

  constructor() {
    this.parsers = [];
  }

  addParser(parser: Parser) {
    this.parsers.push(parser);
  }

  accept(parseConfig: ParseConfig, generator: Generator) {
    var parseResult: ParseResult = new ParseResult();
    for (let parser of this.parsers) {
      let tmp = parser.parse(parseResult);
      if (tmp) {
        parseResult = tmp;
      }
    }

    generator.generate(parseResult);
  }
}
