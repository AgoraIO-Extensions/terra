import * as fs from 'fs';

import { resolvePath } from '@agoraio-extensions/terra-core';

import * as YAML from 'yaml';

export interface TerraLoaderConfig {
  name?: string;
  package?: string;
  path?: string;
  args?: any;
}

export interface TerraConfigs {
  include: string;
  parsers: Array<TerraLoaderConfig>;
  renderers: Array<TerraLoaderConfig>;
}

export class TerraConfigs {
  static parse(config: any): TerraConfigs {
    let yamlContent = fs.readFileSync(config, 'utf8');
    let parsedYaml = YAML.parse(yamlContent);
    let include: string = parsedYaml.include;

    let includePath: string = '';
    if (include) {
      includePath = resolvePath(include);
    }

    let parsers = (parsedYaml.parsers ?? []).map((p: any) => {
      return p as TerraLoaderConfig;
    });

    let renderers = (parsedYaml.renderers ?? []).map((p: any) => {
      return p as TerraLoaderConfig;
    });

    return {
      include: includePath,
      parsers: parsers,
      renderers: renderers,
    };
  }
}
