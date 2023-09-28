import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { TerraContext } from '@agoraio-extensions/terra-core';

import { dumpCXXAstJson, generateChecksum } from '../../src/cxx_parser';

jest.mock('child_process');

describe('cxx_parser', () => {
  let tmpDir: string = '';
  let cppastBackendBuildDir: string = '';
  let cppastBackendBuildBashPath: string = '';

  beforeEach(() => {
    (execSync as jest.Mock).mockReset();

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
    cppastBackendBuildDir = path.join(tmpDir, 'cxx_parser');
    cppastBackendBuildBashPath = path.join(
      __dirname,
      '..',
      '..',
      'cxx',
      'cppast_backend',
      'build.sh'
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('dumpCXXAstJson', () => {
    it('generate ast json by default', () => {
      let file1Path = path.join(tmpDir, 'file1.h');
      let file2Path = path.join(tmpDir, 'file2.h');

      fs.writeFileSync(file1Path, 'void file1_main() {}');
      fs.writeFileSync(file2Path, 'void file2_main() {}');

      const expectedJson = JSON.stringify([
        {
          file_path: '/my/path/IAgoraRtcEngine.h',
          nodes: [
            {
              __TYPE: 'Clazz',
              name: 'TestClazz',
              methods: [
                {
                  __TYPE: 'MemberFunction',
                  name: 'test',
                  parameters: [
                    {
                      __TYPE: 'Variable',
                      name: 'test',
                      type: {
                        __TYPE: 'SimpleType',
                        is_builtin_type: false,
                        is_const: false,
                        kind: 101,
                        name: 'Test',
                        source: 'Test *',
                      },
                    },
                  ],
                  parent_name: 'TestClazz',
                  namespaces: ['test'],
                },
              ],
              namespaces: ['test'],
            },
          ],
        },
      ]);

      let checkSum = generateChecksum([file1Path, file2Path]);
      let jsonFilePath = path.join(
        cppastBackendBuildDir,
        `dump_json_${checkSum}.json`
      );

      (execSync as jest.Mock).mockImplementationOnce(() => {
        // Simulate generate the ast json file after run the bash script
        fs.mkdirSync(cppastBackendBuildDir, { recursive: true });
        fs.writeFileSync(jsonFilePath, expectedJson);
        return '';
      });

      let json = dumpCXXAstJson(
        new TerraContext(tmpDir),
        [],
        [],
        [file1Path, file2Path],
        []
      );

      let expectedBashScript = `bash ${cppastBackendBuildBashPath} \"${cppastBackendBuildDir}\" "--visit-headers=${file1Path},${file2Path} --include-header-dirs= --defines-macros="" --custom-headers= --output-dir=${jsonFilePath} --dump-json"`;
      expect(execSync).toHaveBeenCalledWith(expectedBashScript, {
        encoding: 'utf8',
        stdio: 'inherit',
      });
      expect(json).toEqual(expectedJson);
    });

    it('generate ast json with clean', () => {
      let file1Path = path.join(tmpDir, 'file1.h');
      let file2Path = path.join(tmpDir, 'file2.h');

      fs.writeFileSync(file1Path, 'void file1_main() {}');
      fs.writeFileSync(file2Path, 'void file2_main() {}');

      const expectedJson = JSON.stringify([
        {
          file_path: '/my/path/IAgoraRtcEngine.h',
          nodes: [
            {
              __TYPE: 'Clazz',
              name: 'TestClazz',
              methods: [
                {
                  __TYPE: 'MemberFunction',
                  name: 'test',
                  parameters: [
                    {
                      __TYPE: 'Variable',
                      name: 'test',
                      type: {
                        __TYPE: 'SimpleType',
                        is_builtin_type: false,
                        is_const: false,
                        kind: 101,
                        name: 'Test',
                        source: 'Test *',
                      },
                    },
                  ],
                  parent_name: 'TestClazz',
                  namespaces: ['test'],
                },
              ],
              namespaces: ['test'],
            },
          ],
        },
      ]);

      let checkSum = generateChecksum([file1Path, file2Path]);
      let jsonFilePath = path.join(
        cppastBackendBuildDir,
        `dump_json_${checkSum}.json`
      );

      let isBuildDirExists = false;

      (execSync as jest.Mock).mockImplementationOnce(() => {
        // When passing the `TerraContext.clean` as true, the build dir should be removed.
        isBuildDirExists = fs.existsSync(cppastBackendBuildDir);

        // Simulate generate the ast json file after run the bash script
        fs.mkdirSync(cppastBackendBuildDir, { recursive: true });
        fs.writeFileSync(jsonFilePath, expectedJson);
        return '';
      });

      let json = dumpCXXAstJson(
        new TerraContext(tmpDir, '', '', true, false),
        [],
        [],
        [file1Path, file2Path],
        []
      );

      let expectedBashScript = `bash ${cppastBackendBuildBashPath} \"${cppastBackendBuildDir}\" "--visit-headers=${file1Path},${file2Path} --include-header-dirs= --defines-macros="" --custom-headers= --output-dir=${jsonFilePath} --dump-json"`;
      expect(execSync).toHaveBeenCalledWith(expectedBashScript, {
        encoding: 'utf8',
        stdio: 'inherit',
      });
      expect(json).toEqual(expectedJson);
      expect(isBuildDirExists).toBe(false);
    });

    it('generate ast json with cached ast json', () => {
      let file1Path = path.join(tmpDir, 'file1.h');
      let file2Path = path.join(tmpDir, 'file2.h');

      fs.writeFileSync(file1Path, 'void file1_main() {}');
      fs.writeFileSync(file2Path, 'void file2_main() {}');

      const expectedJson = JSON.stringify([
        {
          file_path: '/my/path/IAgoraRtcEngine.h',
          nodes: [
            {
              __TYPE: 'Clazz',
              name: 'TestClazz',
              methods: [
                {
                  __TYPE: 'MemberFunction',
                  name: 'test',
                  parameters: [
                    {
                      __TYPE: 'Variable',
                      name: 'test',
                      type: {
                        __TYPE: 'SimpleType',
                        is_builtin_type: false,
                        is_const: false,
                        kind: 101,
                        name: 'Test',
                        source: 'Test *',
                      },
                    },
                  ],
                  parent_name: 'TestClazz',
                  namespaces: ['test'],
                },
              ],
              namespaces: ['test'],
            },
          ],
        },
      ]);

      fs.mkdirSync(cppastBackendBuildDir, { recursive: true });
      let checkSum = generateChecksum([file1Path, file2Path]);
      let jsonFilePath = path.join(
        cppastBackendBuildDir,
        `dump_json_${checkSum}.json`
      );
      // Simulate cached ast json file exists
      fs.writeFileSync(jsonFilePath, expectedJson);

      (execSync as jest.Mock).mockImplementationOnce(() => {
        return '';
      });

      let json = dumpCXXAstJson(
        new TerraContext(tmpDir),
        [],
        [],
        [file1Path, file2Path],
        []
      );

      expect(execSync).not.toHaveBeenCalled();
      expect(json).toEqual(expectedJson);
    });
  });

  it('generateChecksum can generate checksum', () => {
    let file1Path = path.join(tmpDir, 'file1.h');
    let file2Path = path.join(tmpDir, 'file2.h');

    fs.writeFileSync(file1Path, 'void file1_main() {}');
    fs.writeFileSync(file2Path, 'void file2_main() {}');

    let res = generateChecksum([file1Path, file2Path]);

    // The md5 of the string "void file1_main() {}\nvoid file2_main() {}", can
    // be easily calculated by online tools.
    let expectedChecksum = '43180edcbadc7e88ed2d6255c65ab9d2';

    expect(res).toEqual(expectedChecksum);
  });
});
