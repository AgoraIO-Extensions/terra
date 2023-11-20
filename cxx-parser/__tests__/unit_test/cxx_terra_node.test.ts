import { SimpleType, SimpleTypeKind, cast } from '../../src';

describe('cast', () => {
  it('case SimpleType', () => {
    let astJsonContent = `
{
    "__TYPE": "SimpleType",
    "is_builtin_type": false,
    "is_const": false,
    "kind": 104,
    "name": "Optional",
    "source": "Optional<double>",
    "template_arguments": ["double"]
}      
`;
    let json = JSON.parse(astJsonContent);
    let simpleType = cast(json) as unknown as SimpleType;
    expect(simpleType.kind).toBe(SimpleTypeKind.template_t);
    expect(simpleType.name).toBe('Optional');
    expect(simpleType.source).toBe('Optional<double>');
    expect(simpleType.template_arguments).toEqual(['double']);
  });
});
