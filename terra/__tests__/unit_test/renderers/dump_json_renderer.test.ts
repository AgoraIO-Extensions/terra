import * as fs from 'fs';
import os from 'os';
import path from 'path';

import { ParseResult, TerraContext } from '@agoraio-extensions/terra-core';

import {
  dumpJsonRenderer,
  terraAstJsonFileName,
} from '../../../src/renderers/dump_json_renderer';

interface FakeNode {
  name: string;
}

describe('dumpJsonRenderer', () => {
  it('able to dump terra ast json', () => {
    let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));

    let dumpJsonFunc = dumpJsonRenderer(
      new TerraContext('', tmpDir, false, false)
    );
    let terraAstPath = path.join(tmpDir, terraAstJsonFileName);

    let parseResult = new ParseResult();
    let fakeNode1: FakeNode = { name: 'fakeNode1' };
    let fakeNode2: FakeNode = { name: 'fakeNode2' };
    parseResult.nodes = [fakeNode1, fakeNode2];

    let expectedContent = JSON.stringify(parseResult.nodes);

    dumpJsonFunc({} as TerraContext, {}, parseResult);

    expect(fs.readFileSync(terraAstPath, 'utf8')).toEqual(expectedContent);
  });
});
