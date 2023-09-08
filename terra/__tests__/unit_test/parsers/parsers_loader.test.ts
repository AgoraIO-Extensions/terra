import path from 'path';

import YAML from 'yaml';

import { ParsersLoader } from './parsers_loader';
import { ParseConfig, ParseResult, Parser } from 'terra-core';

export class TestLoaderParser extends Parser {
  public args: string[];

  constructor({ args }: { args: string[] }) {
    super();
    this.args = args;
  }

  override parse(
    parseConfig: ParseConfig,
    preParseResult?: ParseResult
  ): ParseResult | undefined {
    return undefined;
  }
}

describe('ParsersLoader', () => {
  it('can parse empty', () => {
    let yamlContent = `
parsers:
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new ParsersLoader(importPath);
    let parsers = loader.load(parsedYaml['parsers']);
    expect(parsers).toEqual([]);
  });

  it('can parse single instance', () => {
    let yamlContent = `
parsers:
  TestLoaderParser:
    args:
      - string1
      - string2
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new ParsersLoader(importPath);
    let parser = loader.load(parsedYaml['parsers'])[0];
    expect(parser instanceof TestLoaderParser).toEqual(true);
    expect((parser as TestLoaderParser).args).toEqual(['string1', 'string2']);
  });

  it('can parse instance list', () => {
    let yamlContent = `
parsers:
  - TestLoaderParser:
      args:
        - string1
        - string2
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new ParsersLoader(importPath);
    let parser = loader.load(parsedYaml['parsers'])[0];
    expect(parser instanceof TestLoaderParser).toEqual(true);
    expect((parser as TestLoaderParser).args).toEqual(['string1', 'string2']);
  });

  it('can parse instance list without args', () => {
    let yamlContent = `
parsers:
  - TestLoaderParser
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new ParsersLoader(importPath);
    let parser = loader.load(parsedYaml['parsers'])[0];
    expect(parser instanceof TestLoaderParser).toEqual(true);
  });
});
