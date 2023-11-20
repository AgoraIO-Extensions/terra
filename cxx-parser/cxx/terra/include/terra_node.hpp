#ifndef terra_NODE_H_
#define terra_NODE_H_

#include <iostream>

#include <cppast/code_generator.hpp>         // for generate_code()
#include <cppast/cpp_entity_kind.hpp>        // for the cpp_entity_kind definition
#include <cppast/cpp_forward_declarable.hpp> // for is_definition()
#include <cppast/cpp_namespace.hpp>          // for cpp_namespace
#include <cppast/libclang_parser.hpp>        // for libclang_parser, libclang_compile_config, cpp_entity,...
#include <cppast/visitor.hpp>                // for visit()
#include <cppast/cpp_function.hpp>
#include <cppast/cpp_enum.hpp>
#include <cppast/cpp_member_function.hpp>
#include <cppast/cpp_member_variable.hpp>
#include <cppast/cpp_type_alias.hpp>
#include <cppast/cpp_array_type.hpp>
#include <memory>
#include <stdlib.h>
#include <map>
#include <string>
#include <filesystem>
#include <fstream>
#include <vector>
#include <nlohmann/json.hpp>
#include <typeinfo>
#include <variant>
#include <any>

namespace terra
{

    // using nlohmann::json;

    typedef struct BaseNode
    {
        std::string name;
        std::vector<std::string> namespaces;
        std::string file_path;
        std::string parent_name;
        std::vector<std::string> attributes;
        std::string comment;
        std::string source;
        std::any user_data;

        // Name with namespace
        std::string GetFullName() const
        {
            std::ostringstream vts;
            std::copy(namespaces.begin(), namespaces.end() - 1,
                      std::ostream_iterator<std::string>(vts, "::"));

            vts << namespaces.back();

            std::string ns_prefix = vts.str();
            if (!ns_prefix.empty())
            {
                ns_prefix += "::";
            }

            std::string name_with_ns = ns_prefix + name;

            return name_with_ns;
        }
    } BaseNode;

    typedef struct IncludeDirective : BaseNode
    {
        std::string include_file_path;
    } IncludeDirective;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(IncludeDirective, include_file_path, namespaces, file_path);

    enum SimpleTypeKind
    {
        value_t = 100,
        pointer_t = 101,
        reference_t = 102,
        array_t = 103,
        template_t = 104,
    };

    typedef struct SimpleType
    {
        std::string name;
        std::string source;
        SimpleTypeKind kind;
        bool is_const = false;
        bool is_builtin_type = false;

        /// @brief  Only and maybe have values if the `kind == SimpleTypeKind::template_t`
        std::vector<std::string> template_arguments;

        std::string GetTypeName() const
        {
            if (!name.empty())
            {
                return name;
            }

            return source;
        }
    } SimpleType;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(SimpleType, name, source, kind, is_const, is_builtin_type);

    typedef struct TypeAlias : BaseNode
    {
        SimpleType underlyingType;
    } TypeAlias;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(TypeAlias, name, underlyingType);

    typedef struct Variable : BaseNode
    {
        SimpleType type;
        std::string default_value;
        bool is_output = false;
    } Variable;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Variable, name, type);

    typedef struct MemberFunction : BaseNode
    {
        bool is_virtual;
        SimpleType return_type;
        std::vector<Variable> parameters;
        std::string access_specifier;
        bool is_overriding;
        bool is_const;
        std::string signature;
    } MemberFunction;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(MemberFunction, name, is_virtual, return_type, parameters, access_specifier, is_overriding, signature, namespaces, file_path);

    typedef struct MemberVariable : BaseNode
    {
        SimpleType type;
        bool is_mutable;
        std::string access_specifier;
    } MemberVariable;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(MemberVariable, name, type, is_mutable, access_specifier);

    typedef struct EnumConstant : BaseNode
    {
        std::string value;
    } EnumConstant;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EnumConstant, name, value);

    typedef struct Enumz : BaseNode
    {
        // ~Enumz() = default;
        std::vector<EnumConstant> enum_constants;
    } Enumz;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Enumz, name, enum_constants, namespaces, file_path);

    typedef struct Constructor : BaseNode
    {
        std::vector<Variable> parameters;
    } Constructor;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Constructor, name, parameters);

    typedef struct Clazz : BaseNode
    {
        // ~Clazz() = default;

        std::vector<Constructor> constructors;
        std::vector<MemberFunction> methods;
        std::vector<MemberVariable> member_variables;
        std::vector<std::string> base_clazzs;
    } Clazz;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Clazz, name, constructors, methods, member_variables, base_clazzs, namespaces, file_path);

    typedef struct Struct : Clazz

    {
        // ~Struct() = default;
        // Struct() {}
        // Struct(const Struct &copy) : Clazz(copy) {}
    } Struct;
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Struct, name, constructors, methods, member_variables, base_clazzs, namespaces, file_path);

    typedef std::variant<IncludeDirective, TypeAlias, Clazz, Enumz, Struct, MemberFunction, Variable> NodeType;

    typedef struct CXXFile
    {
        std::string file_path;
        std::vector<NodeType> nodes;
    } CXXFile;

}

#endif // terra_NODE_H_