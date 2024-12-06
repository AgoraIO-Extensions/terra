import fs from 'fs';

import { resolvePath } from '@agoraio-extensions/terra-core';

import YAML from 'yaml';

/**
 * Configuration settings for a terra Parser or Renderer.
 */
export interface TerraLoaderConfig {
  /**
   * The name of the Parser or Renderer. Optional if the Parser or Renderer is defined
   * as a default export.
   */
  name?: string;
  /**
   * The package name where the Parser or Renderer is located.
   * Note: Specify either `package` or `path`, but not both.
   */
  package?: string;
  /**
   * The relative file system path to the parser or renderer, relative to
   * current configuration path.
   * Note: Specify either `path` or `package`, but not both.
   */
  path?: string;
  /**
   * Arguments to be passed to the Parser or Renderer.
   * Can be of any type.
   */
  args?: any;
}

/**
 * Configuration for terra, including parsers and renderers.
 */
export interface TerraConfigs {
  /**
   * Path to the base configuration file for terra, which will be merged with the current configuration, but the same configurations in the current configuration will be overrided the base configuration if the keys are same.
   */
  include: string;
  /**
   * List of parser configurations to be used in terra.
   */
  parsers: Array<TerraLoaderConfig>;
  /**
   * List of renderer configurations to be used in terra.
   */
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
      p.args =
        parsedYaml.globalArgs || p.args
          ? {
              ...parsedYaml.globalArgs,
              ...p.args,
            }
          : undefined;
      return p as TerraLoaderConfig;
    });

    return {
      include: includePath,
      parsers: parsers,
      renderers: renderers,
    };
  }
}
