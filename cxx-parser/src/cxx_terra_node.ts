import path from 'path';

import { TerraNode } from '@agoraio-extensions/terra-core';
import './cxx_terra_node_string_ext';

function getAllClazzs(cxxfiles: CXXFile[]): Clazz[] {
  return cxxfiles.flatMap((file) =>
    file.nodes
      .filter((node) => node.__TYPE === CXXTYPE.Clazz)
      .map((it) => it.asClazz())
  );
}

export enum CXXTYPE {
  Unknown = 'Unknown',
  CXXFile = 'CXXFile',
  IncludeDirective = 'IncludeDirective',
  TypeAlias = 'TypeAlias',
  Clazz = 'Clazz',
  Struct = 'Struct',
  Constructor = 'Constructor',
  MemberFunction = 'MemberFunction',
  Variable = 'Variable',
  SimpleType = 'SimpleType',
  MemberVariable = 'MemberVariable',
  EnumConstant = 'EnumConstant',
  Enumz = 'Enumz',
}

export enum SimpleTypeKind {
  value_t = 100,
  pointer_t = 101,
  reference_t = 102,
  array_t = 103,
  template_t = 104,
}

export abstract class CXXTerraNode implements TerraNode {
  __TYPE: CXXTYPE = CXXTYPE.Unknown;
  name: string = '';
  file_path: string = '';
  namespaces: string[] = [];
  parent_name: string = '';
  parent?: CXXTerraNode;

  attributes: string[] = [];
  comment: string = '';
  source: string = '';
  user_data?: any = undefined;

  public get fullName(): string {
    let fn = this.realName;
    if (this.parent_name) {
      fn = `${this.parent_name}::${fn}`;
    }
    if (this.namespaces?.length > 0) {
      fn = `${this.namespace}::${fn}`;
    }
    return fn;
  }

  get realName(): string {
    return this.name?.trimNamespace() as string;
  }

  get namespace(): string {
    return this.namespaces?.join('::');
  }

  get fileName(): string {
    return path.basename(this.file_path);
  }

  asCXXFile(): CXXFile {
    if (this.__TYPE !== CXXTYPE.CXXFile) {
      throw new Error('This node is not a CXXFile');
    }
    return this as unknown as CXXFile;
  }

  asIncludeDirective(): IncludeDirective {
    if (this.__TYPE !== CXXTYPE.IncludeDirective) {
      throw new Error('This node is not an IncludeDirective');
    }
    return this as unknown as IncludeDirective;
  }

  asTypeAlias(): TypeAlias {
    if (this.__TYPE !== CXXTYPE.TypeAlias) {
      throw new Error('This node is not a TypeAlias');
    }
    return this as unknown as TypeAlias;
  }

  asClazz(): Clazz {
    if (this.__TYPE !== CXXTYPE.Clazz) {
      throw new Error('This node is not a Clazz');
    }
    return this as unknown as Clazz;
  }

  asStruct(): Struct {
    if (this.__TYPE !== CXXTYPE.Struct) {
      throw new Error('This node is not a Struct');
    }
    return this as unknown as Struct;
  }

  asConstructor(): Constructor {
    if (this.__TYPE !== CXXTYPE.Constructor) {
      throw new Error('This node is not a Constructor');
    }
    return this as unknown as Constructor;
  }

  asMemberFunction(): MemberFunction {
    if (this.__TYPE !== CXXTYPE.MemberFunction) {
      throw new Error('This node is not a MemberFunction');
    }
    return this as unknown as MemberFunction;
  }

  asVariable(): Variable {
    if (this.__TYPE !== CXXTYPE.Variable) {
      throw new Error('This node is not a Variable');
    }
    return this as unknown as Variable;
  }

  asSimpleType(): SimpleType {
    if (this.__TYPE !== CXXTYPE.SimpleType) {
      throw new Error('This node is not a SimpleType');
    }
    return this as unknown as SimpleType;
  }

  asMemberVariable(): MemberVariable {
    if (this.__TYPE !== CXXTYPE.MemberVariable) {
      throw new Error('This node is not a MemberVariable');
    }
    return this as unknown as MemberVariable;
  }

  asEnumConstant(): EnumConstant {
    if (this.__TYPE !== CXXTYPE.EnumConstant) {
      throw new Error('This node is not an EnumConstant');
    }
    return this as unknown as EnumConstant;
  }

  asEnumz(): Enumz {
    if (this.__TYPE !== CXXTYPE.Enumz) {
      throw new Error('This node is not an Enumz');
    }
    return this as unknown as Enumz;
  }
}

export class IncludeDirective extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.IncludeDirective;
  include_file_path: string = '';
}

export class TypeAlias extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.TypeAlias;
  underlyingType: SimpleType = new SimpleType();
}

export enum ConstructorInitializerKind {
  Parameter = 'Parameter',
  Value = 'Value',
  Construct = 'Construct',
}

export class ConstructorInitializer {
  kind: ConstructorInitializerKind = ConstructorInitializerKind.Value;
  name: string = '';
  type: string = ''; // Maybe change the type to the `SimpleType` in the furture
  // If the kind is `ConstructorInitializerKind.Parameter`, the `values`'s length is 1,
  // the `values[0]` is the parameter name of the constructor
  //
  // If the kind is `ConstructorInitializerKind.Value`, the `values`'s length is 1,
  // the `values[0]` is the value of the initializer
  //
  // If the kind is `ConstructorInitializerKind.Construct`, the `values`'s length is the
  // constructor parameter's length of the `type`.
  values: string[] = [];
}

export class Constructor extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.Constructor;
  parameters: Variable[] = [];
  initializerList: ConstructorInitializer[] = [];
}

export class Clazz extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.Clazz;
  constructors: Constructor[] = [];
  methods: MemberFunction[] = [];
  member_variables: MemberVariable[] = [];
  base_clazzs: string[] = [];

  findBaseClazzs(cxxfiles: CXXFile[]): Clazz[] {
    if (this.base_clazzs.length === 0) {
      return [];
    }
    return getAllClazzs(cxxfiles)
      .filter((it) => {
        if (this.base_clazzs.includes(it.name)) {
          return true;
        }
      })
      .flatMap((it) => {
        return [it, ...it.findBaseClazzs(cxxfiles)];
      });
  }
}

export class Struct extends Clazz {
  override __TYPE: CXXTYPE = CXXTYPE.Struct;
}

export class Enumz extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.Enumz;
  enum_constants: EnumConstant[] = [];
}

export class MemberFunction extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.MemberFunction;

  is_virtual: boolean = false;
  return_type: SimpleType = new SimpleType();

  parameters: Variable[] = [];
  access_specifier: string = '';
  is_overriding: boolean = false;
  is_const: boolean = false;
  signature: string = '';

  override get fullName(): string {
    return `${this.parent?.fullName}.${this.name}`;
  }
}

export class Variable extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.Variable;
  type: SimpleType = new SimpleType();
  default_value: string = '';
  is_output: boolean = false;

  override get fullName(): string {
    return `${this.parent?.fullName}.${this.name}`;
  }
}

export class SimpleType extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.SimpleType;
  kind: SimpleTypeKind = SimpleTypeKind.value_t;
  is_const: boolean = false;
  is_builtin_type: boolean = false;
  template_arguments: string[] = [];

  override get realName(): string {
    if (this.name) {
      return super.realName;
    }
    return this.source?.trimNamespace();
  }

  // TODO(lxh): Remove this custom logic, this function should return the common full name
  // in C++ way: <namespace>::<name>
  override get fullName(): string {
    if (this.parent?.__TYPE === CXXTYPE.MemberFunction) {
      return `${this.parent?.fullName}@return_type`;
    } else {
      return `${this.parent?.fullName}@type`;
    }
  }
}

export class MemberVariable extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.MemberVariable;
  type: SimpleType = new SimpleType();
  is_mutable: boolean = false;
  access_specifier: string = '';

  override get fullName(): string {
    return `${this.parent?.fullName}.${this.name}`;
  }
}

export class EnumConstant extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.EnumConstant;

  value: string = '';
}

type ParentNodeType =
  | IncludeDirective
  | Clazz
  | Struct
  | Enumz
  | MemberFunction
  | Variable;

export class CXXFile extends CXXTerraNode {
  override __TYPE: CXXTYPE = CXXTYPE.CXXFile;
  nodes: CXXTerraNode[] = [];
}

export function cast(node: any): ParentNodeType {
  if (node.__TYPE == undefined) {
    return node;
  }

  if (node.__TYPE == CXXTYPE.CXXFile) {
    return Object.assign(new CXXFile(), node);
  }
  if (node.__TYPE == CXXTYPE.IncludeDirective) {
    return Object.assign(new IncludeDirective(), node);
  }
  if (node.__TYPE == CXXTYPE.TypeAlias) {
    return Object.assign(new TypeAlias(), node);
  }
  if (node.__TYPE == CXXTYPE.Clazz) {
    return Object.assign(new Clazz(), node);
  }
  if (node.__TYPE == CXXTYPE.Constructor) {
    return Object.assign(new Constructor(), node);
  }
  if (node.__TYPE == CXXTYPE.Struct) {
    return Object.assign(new Struct(), node);
  }
  if (node.__TYPE == CXXTYPE.Enumz) {
    return Object.assign(new Enumz(), node);
  }
  if (node.__TYPE == CXXTYPE.EnumConstant) {
    return Object.assign(new EnumConstant(), node);
  }
  if (node.__TYPE == CXXTYPE.MemberFunction) {
    return Object.assign(new MemberFunction(), node);
  }
  if (node.__TYPE == CXXTYPE.MemberVariable) {
    return Object.assign(new MemberVariable(), node);
  }
  if (node.__TYPE == CXXTYPE.Variable) {
    return Object.assign(new Variable(), node);
  }
  if (node.__TYPE == CXXTYPE.SimpleType) {
    return Object.assign(new SimpleType(), node);
  }

  throw new Error(`Not supported type: ${JSON.stringify(node)}`);
}
