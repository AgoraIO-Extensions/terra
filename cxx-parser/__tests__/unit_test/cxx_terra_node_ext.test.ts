import '../../src/cxx_terra_node_ext';
import { SimpleType, SimpleTypeKind } from '../../src/cxx_terra_node';

describe('cxx_terra_node_ext', () => {
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
