import {
  CXXFile,
  Clazz,
  Constructor,
  EnumConstant,
  Enumz,
  IncludeDirective,
  MemberFunction,
  MemberVariable,
  SimpleType,
  SimpleTypeKind,
  Struct,
  TypeAlias,
  Variable,
  // Import the index file to check if there are any issues with the order of
  // interface declarations and exports.
} from '../../src/index';

describe('cxx_terra_node_ext', () => {
  describe('lenOfArrayType', () => {
    it('lenOfArrayType can get len of array type', () => {
      let simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.array_t;
      simpleType.source = 'int[10]';

      let len = simpleType.lenOfArrayType();
      expect(len).toBe('10');
    });

    it('lenOfArrayType can get len of array type from std type', () => {
      let simpleType = new SimpleType();
      simpleType.kind = SimpleTypeKind.array_t;
      simpleType.source = 'uint8_t[10]';

      let len = simpleType.lenOfArrayType();
      expect(len).toBe('10');
    });
  });

  describe('CXXTerraNode', () => {
    it('isCXXFile', () => {
      let node = new CXXFile();
      expect(node.isCXXFile()).toBe(true);
    });

    it('isIncludeDirective', () => {
      let node = new IncludeDirective();
      expect(node.isIncludeDirective()).toBe(true);
    });

    it('isTypeAlias', () => {
      let node = new TypeAlias();
      expect(node.isTypeAlias()).toBe(true);
    });

    it('isClazz', () => {
      let node = new Clazz();
      expect(node.isClazz()).toBe(true);
    });

    it('isStruct', () => {
      let node = new Struct();
      expect(node.isStruct()).toBe(true);
    });

    it('isConstructor', () => {
      let node = new Constructor();
      expect(node.isConstructor()).toBe(true);
    });

    it('isMemberFunction', () => {
      let node = new MemberFunction();
      expect(node.isMemberFunction()).toBe(true);
    });

    it('isVariable', () => {
      let node = new Variable();
      expect(node.isVariable()).toBe(true);
    });

    it('isSimpleType', () => {
      let node = new SimpleType();
      expect(node.isSimpleType()).toBe(true);
    });

    it('isMemberVariable', () => {
      let node = new MemberVariable();
      expect(node.isMemberVariable()).toBe(true);
    });

    it('isEnumConstant', () => {
      let node = new EnumConstant();
      expect(node.isEnumConstant()).toBe(true);
    });

    it('isEnumz', () => {
      let node = new Enumz();
      expect(node.isEnumz()).toBe(true);
    });
  });
});
