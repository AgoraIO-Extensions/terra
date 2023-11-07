import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { TerraContext } from '@agoraio-extensions/terra-core';

import { CXXParser, dumpCXXAstJson } from '../src/cxx_parser';
import { CXXFile, Struct } from '../src/cxx_terra_node';

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
};
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

  describe('CXXParser', () => {
    it('parse Struct with constructor initializer list', () => {
      let file1Name = 'file1.h';
      let file1Path = path.join(tmpDir, file1Name);

      fs.writeFileSync(
        file1Path,
        `
#pragma once

namespace ns1 {
  struct AAA {
      int aaa_;

      AAA(): aaa_(0) {}
      AAA(int aaa): aaa_(aaa) {}
  };
}
`
      );

      let args = {
        includeHeaderDirs: [],
        definesMacros: [],
        parseFiles: { include: [file1Name] },
        customHeaders: [],
      };

      let parseResult = CXXParser(
        new TerraContext(tmpDir, tmpDir),
        args,
        undefined
      )!;

      let s = (parseResult.nodes[0] as CXXFile).nodes[0] as Struct;
      expect(s.constructors.length).toBe(2);

      expect(s.constructors[0].initializerList.length).toBe(1);
      expect(s.constructors[0].initializerList[0].kind).toEqual('Value');
      expect(s.constructors[0].initializerList[0].name).toEqual('aaa_');
      expect(s.constructors[0].initializerList[0].type).toEqual('int');
      expect(s.constructors[0].initializerList[0].values).toEqual(['0']);

      expect(s.constructors[1].initializerList.length).toBe(1);
      expect(s.constructors[1].initializerList[0].kind).toEqual('Parameter');
      expect(s.constructors[1].initializerList[0].name).toEqual('aaa_');
      expect(s.constructors[1].initializerList[0].type).toEqual('int');
      expect(s.constructors[1].initializerList[0].values).toEqual(['aaa']);
    });
  });
});
