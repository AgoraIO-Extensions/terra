import * as fs from 'fs';
import path from 'path';

import { ParseResult, RenderResult, Renderer, TerraContext } from '@agoraio-extensions/terra-core';

export const terraAstJsonFileName = 'terra_ast.json';

export function dumpJsonRenderer(terraContext: TerraContext): Renderer {
    return function (_: TerraContext, args: any, parseResult: ParseResult): RenderResult[] {
        if (terraContext.outputDir != '') {
            let outputJson = JSON.stringify(parseResult.nodes);
            let outputFilePath = path.join(terraContext.outputDir, terraAstJsonFileName);
            fs.writeFileSync(outputFilePath, outputJson);
            console.log('terra ast json has dumped to: ' + outputFilePath);
        }
        return [];
    }
}