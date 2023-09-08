import path from 'path';

import YAML from 'yaml';

import { RenderersLoader } from './renderers_loader';


export class TestLoaderRenderer extends Renderer<any> {
  public args: string[];

  constructor({ args }: { args: string[] }) {
    super();
    this.args = args;
  }

  override shouldRender(node: TerraNode): boolean {
    return true;
  }
  override render(node: any): RenderedBlock<any> {
    return new RenderedBlock<any>(node, '');
  }
}

describe('RenderersLoader', () => {
  it('can parse single instance', () => {
    let yamlContent = `
renderers:
  TestLoaderRenderer:
    args:
      - string1
      - string2
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new RenderersLoader(importPath);
    let renderer = loader.load(parsedYaml['renderers']);
    expect(renderer instanceof TestLoaderRenderer).toEqual(true);
    expect((renderer as TestLoaderRenderer).args).toEqual([
      'string1',
      'string2',
    ]);
  });

  it('can parse instance list', () => {
    let yamlContent = `
renderers:
  - TestLoaderRenderer:
      args:
        - string1
        - string2
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new RenderersLoader(importPath);
    let renderers = (
      loader.load(parsedYaml['renderers']) as MultiChildRender<any>
    ).children;
    expect(renderers[0] instanceof TestLoaderRenderer).toEqual(true);
    expect((renderers[0] as TestLoaderRenderer).args).toEqual([
      'string1',
      'string2',
    ]);
  });

  it('can parse instance list without args', () => {
    let yamlContent = `
renderers:
  - TestLoaderRenderer
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new RenderersLoader(importPath);
    let renderers = (
      loader.load(parsedYaml['renderers']) as MultiChildRender<any>
    ).children;
    expect(renderers[0] instanceof TestLoaderRenderer).toEqual(true);
  });

  it('can load DefaultRenderer without name', () => {
    let yamlContent = `
renderers:
  - script.ts
  - script.js
`;
    let parsedYaml = YAML.parse(yamlContent);

    let importPath = path.resolve(__filename);
    let loader = new RenderersLoader(importPath, TestLoaderRenderer, (v) => {
      return {
        args: [v],
      };
    });
    let renderers = (
      loader.load(parsedYaml['renderers']) as MultiChildRender<any>
    ).children;
    expect(renderers[0] instanceof loader['defaultRenderer']).toEqual(true);
    expect((renderers[0] as TestLoaderRenderer).args).toEqual(['script.ts']);
    expect(renderers[1] instanceof TestLoaderRenderer).toEqual(true);
    expect((renderers[1] as TestLoaderRenderer).args).toEqual(['script.js']);
  });
});
