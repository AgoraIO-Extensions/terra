import fs from 'fs';
import os from 'os';
import path from 'path';

import { CXXParserConfigs } from '../../src/cxx_parser_configs';

describe('CXXParserConfigs', () => {
  let tmpDir: string = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolve parseFiles and keep path order', () => {
    let path1 = path.join(tmpDir, 'file1.h');
    let path2 = path.join(tmpDir, 'file2.h');
    fs.writeFileSync(path1, '// file1.h');
    fs.writeFileSync(path2, '// file2.h');

    let args = {
      includeHeaderDirs: [],
      definesMacros: [],
      parseFiles: { include: [path1, path2] },
      customHeaders: [],
    };

    let config = CXXParserConfigs.resolve(
      tmpDir,
      args as unknown as CXXParserConfigs
    );

    let expectedFiles = fs.readdirSync(tmpDir);

    expect(config.parseFiles.include).toEqual(expectedFiles);
  });
});
