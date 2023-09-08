import { DumpJsonGenerator, terraAstJsonFileName } from "./dump_json_generator";
import * as fs from 'fs';
import path from 'path';
import os from 'os';
import { ParseResult } from "terra-core";

interface FakeNode {
    name: string
}

describe('DumpJsonGenerator', () => {
    it('able to dump terra ast json', () => {
        let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));

        let dumpJsonGenerator = new DumpJsonGenerator(tmpDir);
        let terraAstPath = path.join(tmpDir, terraAstJsonFileName);

        let parseResult = new ParseResult();
        let fakeNode1: FakeNode = { name: "fakeNode1" };
        let fakeNode2: FakeNode = { name: "fakeNode2" };
        parseResult.nodes = [
            fakeNode1,
            fakeNode2
        ];

        let expectedContent = JSON.stringify(parseResult.nodes);

        dumpJsonGenerator.generate(parseResult);

        expect(fs.readFileSync(terraAstPath, 'utf8')).toEqual(expectedContent);
    });
});