import {
  ParseResult,
  Parser,
  Renderer,
  TerraContext,
} from '@agoraio-extensions/terra-core';

export class TerraShell {
  private parsers: Array<Parser>;
  private renderers: Array<Renderer>;

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
      // The `TerraContext` and the `args`, are passing by the loader
      it({} as TerraContext, {}, parseResult);
    });
  }
}
