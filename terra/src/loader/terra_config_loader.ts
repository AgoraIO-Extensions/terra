import { TerraLoaderConfig } from '../base/terra_configs';
import path from 'path';
import fs from 'fs';
import { ParseResult, Parser, RenderResult, Renderer, TerraContext, requireModule } from '@agoraio-extensions/terra-core';
import { CLIOptions } from '../cli/cli_options';

// export class RequiredTerraLoaderConfig {
//     private readonly config: TerraLoaderConfig;

//     public constructor(config: TerraLoaderConfig) {
//         this.config = config;
//     }

//     resolve(): any { }

// }

// export enum LoadedTerraLoaderConfigType {
//     pathFunc,
//     packageFunc
// }

// export interface LoadedTerraLoaderConfig {
//     type: LoadedTerraLoaderConfigType;
//     loadedFunc: any;
// }

export function resolveTerraLoaderConfig(terraConfigDir: string, config: TerraLoaderConfig): any {
    let instance: any;

    // let instance: Parser | undefined = undefined;

    // let argObj = p.args;

    // const parsers = requireModule(p.package!);
    // instance = new parsers[p.name!](parseConfig, argObj);

    // assert(instance !== undefined, `can not create parser: ${p.name}`);

    // return instance!;

    console.assert(config.path && config.package, "Not supported set both path and pacakge!");
    console.assert(!config.path && !config.package, "Not set the path or package!");

    if (config.path) {
        let p = path.join(terraConfigDir, config.path!);
        let loaded = require(p);
        if (config.name) {
            // export named function
            // let argObj = config.args;

            // const parsers = requireModule(config.package!);
            instance = loaded[config.name!];
        } else {
            // export default function

            // path.join(terraConfigDir, config.path!);

            // // let p = path.resolve(config.path!);
            // let rr = require(p);
            instance = loaded.default
        }
    }

    if (config.package) {
        let loaded = requireModule(config.package!);
        if (config.name) {
            // export named function
            instance = loaded[config.name!];
        } else {
            // export default function
            instance = loaded.default
        }
    }



    // instance = _ioRenderer(
    //   _defaultExportRenderer(rr.default, config.args),
    //   this.cliOptions.outputDir,
    //   // new _DefaultExportRenderer(rr.default)
    // );

    return instance;

    // return {} as LoadedTerraLoaderConfig;
}

function _ioRendererWrapper(delegate: Renderer, terraContext: TerraContext, args: any): Renderer {
    return function (_: TerraContext, __: any, parseResult: ParseResult): RenderResult[] {
        let res = delegate(terraContext, args, parseResult);
        res.forEach(({ file_name, file_content }) => {
            fs.writeFileSync(path.join(terraContext.outputDir, file_name), file_content);
            return file_content;
        });

        return res;
    }
}

function _parserWrapper(delegate: Parser, terraContext: TerraContext, args: any): Parser {
    return function (_: TerraContext, __: any, parseResult?: ParseResult): ParseResult | undefined {
        return delegate(terraContext, args, parseResult);
    }
}

function _defaultExportRenderer(delegate: Renderer, args: any): Renderer {
    return function (terraContext: TerraContext, _: any, parseResult: ParseResult): RenderResult[] {
        return delegate(terraContext, args, parseResult);
    }
}

export class TerraConfigLoader {
    private readonly cliOptions: CLIOptions;

    constructor(cliOptions: CLIOptions) {
        this.cliOptions = cliOptions;
    }

    loadParsers(terraContext: TerraContext, parsers: Array<TerraLoaderConfig>): Parser[] {
        let parsedParsers = parsers.map((it) => {
            return _parserWrapper(resolveTerraLoaderConfig(this.cliOptions.config, it), terraContext, it.args);
        });

        return parsedParsers;
    }

    loadRenderers(terraContext: TerraContext, renderers: Array<TerraLoaderConfig>) {
        let parsedRenderers = renderers.map((it) => {
            // let r = resolveTerraLoaderConfig(this.cliOptions.config, it);
            return _ioRendererWrapper(
                resolveTerraLoaderConfig(this.cliOptions.config, it),
                terraContext,
                it.args,
                // new _DefaultExportRenderer(rr.default)
            );
        });

        return parsedRenderers;
    }
}

