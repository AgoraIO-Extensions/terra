import { ParseResult, TerraContext, Parser, Renderer } from '@agoraio-extensions/terra-core';


export class TerraShell {
    private parsers: Array<Parser>;
    private renderers: Array<Renderer>;

    // constructor(rootParser: T) {
    //     this.parsers = [];
    //     this.rootParser = rootParser;
    //     this.parsers.push(this.rootParser);
    // }

    constructor() {
        this.parsers = [];
        this.renderers = [];
    }

    addParser(parser: Parser) {
        this.parsers.push(parser);
    }

    addRenderer(renderer: Renderer) {
        this.renderers.push(renderer);
    }

    // accept(terraContext: TerraContext, generator: Generator) {
    //     var parseResult: ParseResult = new ParseResult();
    //     for (let parser of this.parsers) {
    //         let tmp = parser(terraContext, {}, parseResult);
    //         if (tmp) {
    //             parseResult = tmp;
    //         }
    //     }

    //     generator.generate(parseResult);
    // }

    run() {
        let parseResult: ParseResult = new ParseResult();
        for (let parser of this.parsers) {
            // The `TerraContext` and the `args`, are passing by the loader
            let tmp = parser({} as TerraContext, {}, parseResult);
            if (tmp) {
                parseResult = tmp;
            }
        }

        this.renderers.forEach((it) => {
            // (terraContext: TerraContext, args: any, parseResult: ParseResult) => RenderResult[];
            it({} as TerraContext, {}, parseResult);


        });
    }
}