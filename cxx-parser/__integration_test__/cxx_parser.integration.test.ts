import fs from 'fs';
import os from 'os';
import path from 'path';

import { TerraContext } from '@agoraio-extensions/terra-core';

import { CXXParser, dumpCXXAstJson, generateChecksum } from '../src/cxx_parser';
import { CXXFile, Struct } from '../src/cxx_terra_node';

describe('cxx_parser', () => {
  let tmpDir: string = '';
  let cxxParserCacheDir: string = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
    cxxParserCacheDir = path.join(tmpDir, 'cxx_parser');
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

      let checkSum = generateChecksum([file1Path]);
      let preProcessParseFilesDir = path.join(
        cxxParserCacheDir,
        `preProcess@${checkSum}`
      );

      // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
      const expectedJson = `
          [
            {
              "__TYPE":"CXXFile",
              "file_path":"${preProcessParseFilesDir}/file1.h",
              "nodes":[
                {
                  "__TYPE":"Struct",
                  "attributes":[],
                  "base_clazzs":[],
                  "comment":"",
                  "conditional_compilation_directives_infos": [],
                  "constructors":[],
                  "file_path":"${preProcessParseFilesDir}/file1.h",
                  "member_variables":[
                    {
                      "__TYPE":"MemberVariable",
                      "access_specifier":"",
                      "attributes": [],
                      "comment":"",
                      "conditional_compilation_directives_infos":[],
                      "file_path":"${preProcessParseFilesDir}/file1.h",
                      "is_mutable":false,
                      "name":"a",
                      "namespaces": [],
                      "parent_name": "AAA",
                      "source": "",
                      "type":{
                        "__TYPE":"SimpleType",
                        "is_builtin_type":true,
                        "is_const":false,
                        "kind":100,
                        "name":"int",
                        "source":"int",
                        "template_arguments":[]
                      }
                    }
                  ],
                  "methods":[],
                  "name":"AAA",
                  "namespaces":[],
                  "parent_name":"${preProcessParseFilesDir}/file1.h",
                  "source":""
                }
              ]
            }
          ]
          `;

      let json = dumpCXXAstJson(new TerraContext(tmpDir), [], [file1Path], []);

      expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

      // Use `JSON.parse` to parse the json string to avoid the format issue
      expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
    });

    describe('parse typedef', () => {
      it('c-style typedef struct', () => {
        let file1Path = path.join(tmpDir, 'file1.h');

        fs.writeFileSync(
          file1Path,
          `
  typedef struct AAA {
    int a;
  } AAA;
  `
        );

        let checkSum = generateChecksum([file1Path]);
        let preProcessParseFilesDir = path.join(
          cxxParserCacheDir,
          `preProcess@${checkSum}`
        );

        // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
        const expectedJson = `
        [
          {
            "__TYPE":"CXXFile",
            "file_path":"${preProcessParseFilesDir}/file1.h",
            "nodes":[
              {
                "__TYPE":"Struct",
                "attributes":[],
                "base_clazzs":[],
                "comment":"",
                "conditional_compilation_directives_infos": [],
                "constructors":[],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "member_variables":[
                  {
                    "__TYPE":"MemberVariable",
                    "access_specifier":"",
                    "attributes": [],
                    "comment":"",
                    "conditional_compilation_directives_infos": [],
                    "file_path":"${preProcessParseFilesDir}/file1.h",
                    "is_mutable":false,
                    "name":"a",
                    "namespaces": [],
                    "parent_name": "AAA",
                    "source": "",
                    "type":{
                      "__TYPE":"SimpleType",
                      "is_builtin_type":true,
                      "is_const":false,
                      "kind":100,
                      "name":"int",
                      "source":"int",
                      "template_arguments":[]
                    }
                  }
                ],
                "methods":[],
                "name":"AAA",
                "namespaces":[],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source":""
              }
            ]
          }
        ]
        `;

        let json = dumpCXXAstJson(
          new TerraContext(tmpDir),
          [],
          [file1Path],
          []
        );

        expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

        // Use `JSON.parse` to parse the json string to avoid the format issue
        expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
      });

      it('c-style typedef struct with empty name', () => {
        let file1Path = path.join(tmpDir, 'file1.h');

        fs.writeFileSync(
          file1Path,
          `
  typedef struct {
    int a;
  } AAA;
  `
        );

        let checkSum = generateChecksum([file1Path]);
        let preProcessParseFilesDir = path.join(
          cxxParserCacheDir,
          `preProcess@${checkSum}`
        );

        // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
        const expectedJson = `
        [
          {
            "__TYPE":"CXXFile",
            "file_path":"${preProcessParseFilesDir}/file1.h",
            "nodes":[
              {
                "__TYPE":"Struct",
                "attributes":[],
                "base_clazzs":[],
                "comment":"",
                "conditional_compilation_directives_infos": [],
                "constructors":[],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "member_variables":[
                  {
                    "__TYPE":"MemberVariable",
                    "access_specifier":"",
                    "attributes": [],
                    "comment":"",
                    "conditional_compilation_directives_infos": [],
                    "file_path":"${preProcessParseFilesDir}/file1.h",
                    "is_mutable":false,
                    "name":"a",
                    "namespaces": [],
                    "parent_name": "",
                    "source": "",
                    "type":{
                      "__TYPE":"SimpleType",
                      "is_builtin_type":true,
                      "is_const":false,
                      "kind":100,
                      "name":"int",
                      "source":"int",
                      "template_arguments":[]
                    }
                  }
                ],
                "methods":[],
                "name":"AAA",
                "namespaces":[],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source":""
              }
            ]
          }
        ]
        `;

        let json = dumpCXXAstJson(
          new TerraContext(tmpDir),
          [],
          [file1Path],
          []
        );

        expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

        // Use `JSON.parse` to parse the json string to avoid the format issue
        expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
      });

      it('c-style typedef enum', () => {
        let file1Path = path.join(tmpDir, 'file1.h');

        fs.writeFileSync(
          file1Path,
          `
  typedef enum MyEnum {
    A = 0,
  } MyEnum;
  `
        );

        let checkSum = generateChecksum([file1Path]);
        let preProcessParseFilesDir = path.join(
          cxxParserCacheDir,
          `preProcess@${checkSum}`
        );

        // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
        const expectedJson = `
        [
          {
            "__TYPE":"CXXFile",
            "file_path":"${preProcessParseFilesDir}/file1.h",
            "nodes":[
              {
                "__TYPE":"Enumz",
                "attributes":[],
                "comment":"",
                "conditional_compilation_directives_infos": [],
                "enum_constants": [
                  {
                    "__TYPE": "EnumConstant",
                    "attributes": [],
                    "comment":"",
                    "conditional_compilation_directives_infos": [],
                    "file_path": "",
                    "name": "A",
                    "namespaces": [],
                    "parent_name": "MyEnum",
                    "source": "0",
                    "value": "0"
                  }
                ],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "name":"MyEnum",
                "namespaces":[],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source":""
              }
            ]
          }
        ]
        `;

        let json = dumpCXXAstJson(
          new TerraContext(tmpDir),
          [],
          [file1Path],
          []
        );

        expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

        // Use `JSON.parse` to parse the json string to avoid the format issue
        expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
      });

      it('c-style typedef enum with empty name', () => {
        let file1Path = path.join(tmpDir, 'file1.h');

        fs.writeFileSync(
          file1Path,
          `
  typedef enum {
    A = 0,
  } MyEnum;
  `
        );

        let checkSum = generateChecksum([file1Path]);
        let preProcessParseFilesDir = path.join(
          cxxParserCacheDir,
          `preProcess@${checkSum}`
        );

        // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
        const expectedJson = `
        [
          {
            "__TYPE":"CXXFile",
            "file_path":"${preProcessParseFilesDir}/file1.h",
            "nodes":[
              {
                "__TYPE":"Enumz",
                "attributes":[],
                "comment":"",
                "conditional_compilation_directives_infos": [],
                "enum_constants": [
                  {
                    "__TYPE": "EnumConstant",
                    "attributes": [],
                    "comment":"",
                    "conditional_compilation_directives_infos": [],
                    "file_path": "",
                    "name": "A",
                    "namespaces": [],
                    "parent_name": "",
                    "source": "0",
                    "value": "0"
                  }
                ],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "name":"MyEnum",
                "namespaces":[],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source":""
              }
            ]
          }
        ]
        `;

        let json = dumpCXXAstJson(
          new TerraContext(tmpDir),
          [],
          [file1Path],
          []
        );

        expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

        // Use `JSON.parse` to parse the json string to avoid the format issue
        expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
      });

      it('normal typedef void*', () => {
        let file1Path = path.join(tmpDir, 'file1.h');

        fs.writeFileSync(
          file1Path,
          `
  typedef void* view_t;
  `
        );

        let checkSum = generateChecksum([file1Path]);
        let preProcessParseFilesDir = path.join(
          cxxParserCacheDir,
          `preProcess@${checkSum}`
        );

        // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
        const expectedJson = `
        [
          {
            "__TYPE":"CXXFile",
            "file_path":"${preProcessParseFilesDir}/file1.h",
            "nodes":[
              {
                "__TYPE": "TypeAlias",
                "attributes": [],
                "comment": "",
                "conditional_compilation_directives_infos": [],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "name": "view_t",
                "namespaces": [],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source": "",
                "underlyingType": {
                  "__TYPE": "SimpleType",
                  "is_builtin_type": true,
                  "is_const": false,
                  "kind": 101,
                  "name": "void",
                  "source": "void*",
                  "template_arguments": []
                }
              }
            ]
          }
        ]
        `;

        let json = dumpCXXAstJson(
          new TerraContext(tmpDir),
          [],
          [file1Path],
          []
        );

        expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

        // Use `JSON.parse` to parse the json string to avoid the format issue
        expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
      });

      it('normal typedef void* under typedef struct', () => {
        let file1Path = path.join(tmpDir, 'file1.h');

        fs.writeFileSync(
          file1Path,
          `
  struct AAA {
    int a;
  };

  typedef void* view_t;
  `
        );

        let checkSum = generateChecksum([file1Path]);
        let preProcessParseFilesDir = path.join(
          cxxParserCacheDir,
          `preProcess@${checkSum}`
        );

        // TODO(littlegnal): Should move the tmp/*.h to the build dir in the future
        const expectedJson = `
        [
          {
            "__TYPE":"CXXFile",
            "file_path":"${preProcessParseFilesDir}/file1.h",
            "nodes":[
              {
                "__TYPE":"Struct",
                "attributes":[],
                "base_clazzs":[],
                "comment":"",
                "conditional_compilation_directives_infos":[],
                "constructors":[],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "member_variables":[
                  {
                    "__TYPE":"MemberVariable",
                    "access_specifier":"",
                    "attributes": [],
                    "comment":"",
                    "conditional_compilation_directives_infos": [],
                    "file_path":"${preProcessParseFilesDir}/file1.h",
                    "is_mutable":false,
                    "name":"a",
                    "namespaces": [],
                    "parent_name": "AAA",
                    "source": "",
                    "type":{
                      "__TYPE":"SimpleType",
                      "is_builtin_type":true,
                      "is_const":false,
                      "kind":100,
                      "name":"int",
                      "source":"int",
                      "template_arguments":[]
                    }
                  }
                ],
                "methods":[],
                "name":"AAA",
                "namespaces":[],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source":""
              },
              {
                "__TYPE": "TypeAlias",
                "attributes": [],
                "comment": "",
                "conditional_compilation_directives_infos": [],
                "file_path":"${preProcessParseFilesDir}/file1.h",
                "name": "view_t",
                "namespaces": [],
                "parent_name":"${preProcessParseFilesDir}/file1.h",
                "source": "",
                "underlyingType": {
                  "__TYPE": "SimpleType",
                  "is_builtin_type": true,
                  "is_const": false,
                  "kind": 101,
                  "name": "void",
                  "source": "void*",
                  "template_arguments": []
                }
              }
            ]
          }
        ]
        `;

        let json = dumpCXXAstJson(
          new TerraContext(tmpDir),
          [],
          [file1Path],
          []
        );

        expect(fs.existsSync(preProcessParseFilesDir)).toBe(true);

        // Use `JSON.parse` to parse the json string to avoid the format issue
        expect(JSON.parse(json)).toEqual(JSON.parse(expectedJson));
      });
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

  describe('system_fake', () => {
    it('include Windows.h file', () => {
      //if include wrong file, it will got test failed but except macos environment
      let file1Name = 'file1.h';
      let file1Path = path.join(tmpDir, file1Name);

      fs.writeFileSync(
        file1Path,
        `
  #pragma once
  #include <Windows.h>

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
      expect(s.constructors).toBeUndefined();
    });
  });
});
