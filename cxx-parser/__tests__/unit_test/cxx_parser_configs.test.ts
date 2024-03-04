import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  CXXParserConfigs,
  ParseFilesConfig,
} from '../../src/cxx_parser_configs';

describe('CXXParserConfigs', () => {
  let tmpDir: string = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolve buildDirNamePrefix', () => {
    let args = {
      buildDirNamePrefix: 'prefix',
    };

    let config = CXXParserConfigs.resolve(
      tmpDir,
      args as unknown as CXXParserConfigs
    );

    expect(config.buildDirNamePrefix).toEqual('prefix');
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

    let expectedFiles = fs.readdirSync(tmpDir).map((it) => {
      return path.join(tmpDir, it);
    });

    expect(config.parseFiles.include.length).toBe(2);
    expect(config.parseFiles.include[0]).toEqual(expectedFiles[0]); // file1.h
    expect(config.parseFiles.include[1]).toEqual(expectedFiles[1]); // file2.h
  });
});

describe('ParseFilesConfig', () => {
  let tmpDir: string = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolveParseFiles with exclude', () => {
    let path1 = path.join(tmpDir, 'file1.h');
    let path2 = path.join(tmpDir, 'file2.h');
    fs.writeFileSync(path1, '// file1.h');
    fs.writeFileSync(path2, '// file2.h');

    let args = {
      includeHeaderDirs: [],
      definesMacros: [],
      parseFiles: { include: [path1, path2], exclude: [path2] },
      customHeaders: [],
    };

    let config = CXXParserConfigs.resolve(
      tmpDir,
      args as unknown as CXXParserConfigs
    );

    let finalParseFiles = ParseFilesConfig.resolveParseFiles(config.parseFiles);

    expect(finalParseFiles.length).toBe(1);
    expect(finalParseFiles[0]).toEqual(path1); // file1.h
  });
});
