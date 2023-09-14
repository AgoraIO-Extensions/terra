// export * from "./app_root_path";
export * from "./path_resolver";

export interface TerraNode { }

export class ParseResult {
    nodes: TerraNode[] = [];
}

// export interface Generator {
//     generate(parseResult: ParseResult): boolean;
// }

export class TerraContext {
    constructor(
        public readonly configDir: string = "",
        public readonly outputDir: string = "",
        public readonly cache: boolean = false
    ) { }
}

// export class ParseConfig {
//     constructor(
//         public readonly configDir: string = "",
//         public readonly outputDir: string = "",
//         public readonly cache: boolean = false,
//         public readonly userData: any
//     ) { }
// }

export type Parser = (terraContext: TerraContext, args: any, parseResult?: ParseResult) => ParseResult | undefined;

// export abstract class Parser {
//     constructor(parseConfig: ParseConfig) { }

//     abstract parse(preParseResult?: ParseResult): ParseResult | undefined;
// }

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

// export interface Renderer {
//     render(parseResult: ParseResult): RenderResult[];
// }

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
export type Renderer = (terraContext: TerraContext, args: any, parseResult: ParseResult) => RenderResult[];

// export class DefaultVisitor {
//     private parsers: Array<any>;

//     // constructor(rootParser: T) {
//     //     this.parsers = [];
//     //     this.rootParser = rootParser;
//     //     this.parsers.push(this.rootParser);
//     // }

//     constructor() {
//         this.parsers = [];
//     }

//     addParser(parser: any) {
//         this.parsers.push(parser);
//     }

//     accept(terraContext: TerraContext, generator: Generator) {
//         var parseResult: ParseResult = new ParseResult();
//         for (let parser of this.parsers) {
//             let tmp = parser(terraContext, {}, parseResult);
//             if (tmp) {
//                 parseResult = tmp;
//             }
//         }

//         generator.generate(parseResult);
//     }
// }
