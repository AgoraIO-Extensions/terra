import fs from 'fs';
import os from 'os';
import path from 'path';

import { TerraContext } from '@agoraio-extensions/terra-core';

import { dumpCXXAstJson } from '../src/cxx_parser';

describe('cxx_parser', () => {
  let tmpDir: string = '';
  let cppastBackendPath: string = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
    cppastBackendPath = path.join(__dirname, '..', 'cxx', 'cppast_backend');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('dumpCXXAstJson', () => {
    it('generate ast json by default', () => {
      let file1Path = path.join(tmpDir, 'file1.h');

      fs.writeFileSync(
        file1Path,
        `
struct AAA {
    int a;
}
`
      );

      // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
      const expectedJson = `
      [
        {
          "__TYPE":"CXXFile",
          "file_path":"${cppastBackendPath}/tmp/file1.h",
          "nodes":[
            {
              "__TYPE":"Struct",
              "attributes":[],
              "base_clazzs":[],
              "comment":"",
              "constructors":[],
              "file_path":"${cppastBackendPath}/tmp/file1.h",
              "member_variables":[
                {
                  "__TYPE":"MemberVariable",
                  "access_specifier":"",
                  "is_mutable":false,
                  "name":"a",
                  "type":{
                    "__TYPE":"SimpleType",
                    "is_builtin_type":true,
                    "is_const":false,
                    "kind":100,
                    "name":"int",
                    "source":"int"
                  }
                }
              ],
              "methods":[],
              "name":"AAA",
              "namespaces":[],
              "parent_name":"${cppastBackendPath}/tmp/file1.h",
              "source":""
            }
          ]
        }
      ]
      `;

      let json = dumpCXXAstJson(
        new TerraContext(tmpDir),
        [],
        [],
        [file1Path],
        []
      );

      // Use `JSON.parse` to parse the json string to avoid the format issue
      expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
    });
  });
});
