import '../../src/cxx_parser_ext';
import { ParseResult } from '@agoraio-extensions/terra-core';

import {
  Clazz,
  Enumz,
  SimpleType,
  SimpleTypeKind,
  Struct,
} from '../../src/cxx_terra_node';

describe('ParseResult', () => {
  describe('resolveNodeByType', () => {
    it('can find Clazz when the SimpleType ref to a class', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.pointer_t;
      simpleType.name = 'A::B::MyClass';
      simpleType.source = 'MyClass*';

      const clazz = new Clazz();
      clazz.name = 'MyClass';
      clazz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [clazz],
        },
      ];

      const node = parseResult.resolveNodeByType(simpleType);
      expect(node).toBe(clazz);
    });

    it('can find Clazz with duplicated name, but different namespace', () => {
      let parseResult = new ParseResult();

      const clazz1 = new Clazz();
      clazz1.name = 'MyClass';
      clazz1.namespaces = ['A', 'B'];

      const clazz2 = new Clazz();
      clazz2.name = 'MyClass';
      clazz2.namespaces = ['A', 'B', 'C'];

      parseResult.nodes = [
        {
          nodes: [clazz1, clazz2],
        },
      ];

      {
        const simpleType = new SimpleType();
        simpleType.kind = SimpleTypeKind.pointer_t;
        simpleType.name = 'A::B::MyClass';
        simpleType.source = 'MyClass*';
        const node = parseResult.resolveNodeByType(simpleType);
        expect(node).toBe(clazz1);
      }

      // Can find the second A::B::C::MyClass
      {
        const simpleType = new SimpleType();
        simpleType.kind = SimpleTypeKind.pointer_t;
        simpleType.name = 'A::B::C::MyClass';
        simpleType.source = 'MyClass*';
        const node = parseResult.resolveNodeByType(simpleType);
        expect(node).toBe(clazz2);
      }
    });

    it('can find Struct when the SimpleType ref to a struct', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.pointer_t;
      simpleType.name = 'A::B::MyStruct';
      simpleType.source = 'MyStruct*';

      const struct = new Struct();
      struct.name = 'MyStruct';
      struct.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [struct],
        },
      ];

      const node = parseResult.resolveNodeByType(simpleType);
      expect(node).toBe(struct);
    });

    it('can find Enum, when the SimpleType ref to a enum', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.pointer_t;
      simpleType.name = 'A::B::MyEnum';
      simpleType.source = 'MyEnum*';

      const enumz = new Enumz();
      enumz.name = 'MyEnum';
      enumz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [enumz],
        },
      ];

      const node = parseResult.resolveNodeByType(simpleType);
      expect(node).toBe(enumz);
    });

    it('return type if it is built-in type', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.value_t;
      simpleType.name = 'int';
      simpleType.source = 'int';

      const returnType = parseResult.resolveNodeByType(simpleType);
      expect(returnType).toBe(simpleType);
    });

    it('can find Clazz when the SimpleType is template_t and template_arguments ref to a class', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.template_t;
      simpleType.name = 'TemplateType';
      simpleType.source = 'TemplateType<MyClass>';
      simpleType.template_arguments = ['A::B::MyClass'];

      const clazz = new Clazz();
      clazz.name = 'MyClass';
      clazz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [clazz],
        },
      ];

      const node = parseResult.resolveNodeByType(simpleType);
      expect(node).toBe(clazz);
    });

    it('can find Struct when the SimpleType is template_t and template_arguments ref to a struct', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.template_t;
      simpleType.name = 'TemplateType';
      simpleType.source = 'TemplateType<MyStruct>';
      simpleType.template_arguments = ['A::B::MyStruct'];

      const struct = new Struct();
      struct.name = 'MyStruct';
      struct.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [struct],
        },
      ];

      const node = parseResult.resolveNodeByType(simpleType);
      expect(node).toBe(struct);
    });

    it('can find Enum, when the SimpleType is template_t and template_arguments ref to a enum', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.template_t;
      simpleType.name = 'TemplateType';
      simpleType.source = 'TemplateType<MyEnum>';
      simpleType.template_arguments = ['A::B::MyEnum'];

      const enumz = new Enumz();
      enumz.name = 'MyEnum';
      enumz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [enumz],
        },
      ];

      const node = parseResult.resolveNodeByType(simpleType);
      expect(node).toBe(enumz);
    });

    it('return type if the SimpleType is template_t and template_arguments not ref to any nodes', () => {
      let parseResult = new ParseResult();
      const simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.template_t;
      simpleType.name = 'TemplateType';
      simpleType.source = 'TemplateType<int>';
      simpleType.template_arguments = ['int'];

      const returnType = parseResult.resolveNodeByType(simpleType);
      expect(returnType).toBe(simpleType);
    });
  });

  describe('resolveNodeByName', () => {
    it('can find Clazz with name', () => {
      let parseResult = new ParseResult();

      const clazz = new Clazz();
      clazz.name = 'MyClass';
      clazz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [clazz],
        },
      ];

      const node = parseResult.resolveNodeByName('A::B::MyClass');
      expect(node).toBe(clazz);
    });

    it('can find Clazz with duplicated name, but different namespace', () => {
      let parseResult = new ParseResult();

      const clazz1 = new Clazz();
      clazz1.name = 'MyClass';
      clazz1.namespaces = ['A', 'B'];

      const clazz2 = new Clazz();
      clazz2.name = 'MyClass';
      clazz2.namespaces = ['A', 'B', 'C'];

      parseResult.nodes = [
        {
          nodes: [clazz1, clazz2],
        },
      ];

      {
        const node = parseResult.resolveNodeByName('A::B::MyClass');
        expect(node).toBe(clazz1);
      }

      // Can find the second A::B::C::MyClass
      {
        const node = parseResult.resolveNodeByName('A::B::C::MyClass');
        expect(node).toBe(clazz2);
      }
    });

    it('can find Struct with name', () => {
      let parseResult = new ParseResult();

      const struct = new Struct();
      struct.name = 'MyStruct';
      struct.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [struct],
        },
      ];

      const node = parseResult.resolveNodeByName('A::B::MyStruct');
      expect(node).toBe(struct);
    });

    it('can find Enum with name', () => {
      let parseResult = new ParseResult();

      const enumz = new Enumz();
      enumz.name = 'MyEnum';
      enumz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [enumz],
        },
      ];

      const node = parseResult.resolveNodeByName('A::B::MyEnum');
      expect(node).toBe(enumz);
    });

    it('can not find a node by name', () => {
      let parseResult = new ParseResult();

      const clazz = new Clazz();
      clazz.name = 'MyClass';
      clazz.namespaces = ['A', 'B'];

      parseResult.nodes = [
        {
          nodes: [clazz],
        },
      ];

      const returnType = parseResult.resolveNodeByName('unknow');
      expect(returnType).toBeUndefined();
    });
  });
});
