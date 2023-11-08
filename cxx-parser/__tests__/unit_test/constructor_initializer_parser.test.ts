import fs from 'fs';
import os from 'os';
import path from 'path';

import { ClangASTStructConstructorParser } from '../../src/constructor_initializer_parser';

import { genParseResultFromJson } from '../../src/cxx_parser';
import {
  CXXFile,
  ConstructorInitializerKind,
  Struct,
} from '../../src/cxx_terra_node';

describe('constructor_initializer_parser', () => {
  let tmpDir: string = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('fillCXXTerraNodeConstructor', () => {
    it('can fill the struct constructor initializer list', () => {
      let cppastBackendPath = path.join(
        __dirname,
        '..',
        '..',
        'cxx',
        'cppast_backend'
      );

      let file1Path = path.join(tmpDir, 'file1.h');

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

      let cppastJSON = `
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
              "constructors":[
                {
                  "__TYPE":"Constructor",
                  "name":"AAA",
                  "parameters":[]
                },
                {
                  "__TYPE":"Constructor",
                  "name":"AAA",
                  "parameters":[
                    {
                      "__TYPE":"Variable",
                      "default_value":"",
                      "is_output":false,
                      "name":"aaa",
                      "type":{
                        "__TYPE":"SimpleType",
                        "is_builtin_type":true,
                        "is_const":false,
                        "kind":100,
                        "name":"int",
                        "source":"int"
                      }
                    }
                  ]
                }
              ],
              "file_path":"${cppastBackendPath}/tmp/file1.h",
              "member_variables":[
                {
                  "__TYPE":"MemberVariable",
                  "access_specifier":"",
                  "is_mutable":false,
                  "name":"aaa_",
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
              "namespaces":["ns1"],
              "parent_name":"ns1",
              "source":""
            }
          ]
        }
      ]`;

      let parseResult = genParseResultFromJson(cppastJSON);

      ClangASTStructConstructorParser(tmpDir, [], [file1Path], parseResult);

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

    describe('parseStructConstructors', () => {
      const testingUsed = require('../../src/constructor_initializer_parser');
      // Aim to test the private funtion
      const parseStructConstructors = testingUsed.parseStructConstructors;

      it('empty constructor', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
      
namespace ns1 {
  struct AAA {
      AAA() {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('default constructor', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
      
namespace ns1 {
  struct AAA {
      AAA() = default;
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('declare struct only', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
      
namespace ns1 {
  struct AAANameOnly;

  struct AAA {
    AAA() = default;
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign enum', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
      
namespace ns1 {
  enum AAA_ENUM {
    ERR_OK = 0,
    ERR_NOT_READY = 3
  };

  struct AAA {
      AAA_ENUM aaa_enum_;

      AAA(): aaa_enum_(ERR_NOT_READY) {}

      AAA(AAA_ENUM aaa_enum): aaa_enum_(aaa_enum) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_enum_',
                    type: 'ns1::AAA_ENUM',
                    values: ['ns1::AAA_ENUM::ERR_NOT_READY'],
                  },
                ],
              },
              {
                name: 'AAA',
                signature: 'void (ns1::AAA_ENUM)',
                parameterList: [
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'aaa_enum',
                    type: 'ns1::AAA_ENUM',
                    values: ['aaa_enum'],
                  },
                ],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'aaa_enum_',
                    type: 'ns1::AAA_ENUM',
                    values: ['aaa_enum'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('fill constructor assign enum to int', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once

namespace ns1 {
  enum AAA_ENUM {
    ERR_OK = 0,
    ERR_NOT_READY = 3
  };

  struct AAA {
      int aaa_;

      AAA(): aaa_(-ERR_NOT_READY) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'int',
                    values: ['-ns1::AAA_ENUM::ERR_NOT_READY'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign NULL to typedef type', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdio.h>

namespace ns1 {
  typedef void* view_t;

  struct AAA {
      view_t aaa_;

      AAA(): aaa_(NULL) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'ns1::view_t',
                    values: ['NULL'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign pointer with std nullptr', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdio.h>

namespace ns1 {
  struct AAA {
      void *aaa_;

      AAA(): aaa_(nullptr) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'void *',
                    values: ['std::nullptr_t'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign float value', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdint.h>

namespace ns1 {
  struct AAA {
      float aaa_;

      AAA(): aaa_(0.0) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'float',
                    values: ['0'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign double value', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdint.h>

namespace ns1 {
  struct AAA {
      double aaa_;

      AAA(): aaa_(0.0) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'double',
                    values: ['0'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign int with negative value', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdint.h>

namespace ns1 {
  struct AAA {
      int aaa_;

      AAA(): aaa_(-1) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'int',
                    values: ['-1'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign bool value', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdint.h>

namespace ns1 {
  struct AAA {
      bool aaa_;

      AAA(): aaa_(false) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'bool',
                    values: ['false'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign uint32_t with hex value', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
#include <stdint.h>

namespace ns1 {
  struct AAA {
      uint32_t aaa_;

      AAA(): aaa_(0x00000000) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'uint32_t',
                    values: ['0'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor assign with struct construct', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once

namespace ns1 {
  struct Rectangle {
      int x;
      int y;
      int width;
      int height;
    
      Rectangle(int xx, int yy, int ww, int hh) : x(xx), y(yy), width(ww), height(hh) {}
  };

  struct AAA {
      Rectangle aaa_;

      AAA(): aaa_(0, 0, 0, 0) {}
  };
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::Rectangle',
            constructors: [
              {
                name: 'Rectangle',
                signature: 'void (int, int, int, int)',
                parameterList: [
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'xx',
                    type: 'int',
                    values: ['xx'],
                  },
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'yy',
                    type: 'int',
                    values: ['yy'],
                  },
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'ww',
                    type: 'int',
                    values: ['ww'],
                  },
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'hh',
                    type: 'int',
                    values: ['hh'],
                  },
                ],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'x',
                    type: 'int',
                    values: ['xx'],
                  },
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'y',
                    type: 'int',
                    values: ['yy'],
                  },
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'width',
                    type: 'int',
                    values: ['ww'],
                  },
                  {
                    kind: ConstructorInitializerKind.Parameter,
                    name: 'height',
                    type: 'int',
                    values: ['hh'],
                  },
                ],
              },
            ],
          },
          {
            name: 'ns1::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Construct,
                    name: 'aaa_',
                    type: 'ns1::Rectangle',
                    values: ['0', '0', '0', '0'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });

      it('constructor with multiple nested namespaces', () => {
        let filePath = path.join(tmpDir, 'file.h');
        let fileContent = `
#pragma once
      
namespace ns1 {
namespace ns2 {
  struct AAA {
      int aaa_;

      AAA(): aaa_(0) {}
  };
}
}
`;
        fs.writeFileSync(filePath, fileContent);

        let constructorInitializers = parseStructConstructors(
          tmpDir,
          [],
          [filePath]
        );

        let expectedRes = [
          {
            name: 'ns1::ns2::AAA',
            constructors: [
              {
                name: 'AAA',
                signature: 'void ()',
                parameterList: [],
                initializerList: [
                  {
                    kind: ConstructorInitializerKind.Value,
                    name: 'aaa_',
                    type: 'int',
                    values: ['0'],
                  },
                ],
              },
            ],
          },
        ];

        expect(JSON.stringify(constructorInitializers)).toEqual(
          JSON.stringify(expectedRes)
        );
      });
    });
  });
});
