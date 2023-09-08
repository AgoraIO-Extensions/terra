#ifndef terra_H_
#define terra_H_

#include <iostream>
#include <filesystem>

#include <cppast/code_generator.hpp>         // for generate_code()
#include <cppast/cpp_entity_kind.hpp>        // for the cpp_entity_kind definition
#include <cppast/cpp_forward_declarable.hpp> // for is_definition()
#include <cppast/cpp_namespace.hpp>          // for cpp_namespace
#include <cppast/libclang_parser.hpp>        // for libclang_parser, libclang_compile_config, cpp_entity,...
#include <cppast/visitor.hpp>                // for visit()
#include <cppast/cpp_function.hpp>
#include <cppast/cpp_class.hpp>
#include <cppast/cpp_enum.hpp>
#include <cppast/cpp_member_function.hpp>
#include <cppast/cpp_member_variable.hpp>
#include <cppast/cpp_type_alias.hpp>
#include <cppast/cpp_array_type.hpp>
#include <cppast/cpp_variable.hpp>
#include <cppast/cpp_template_parameter.hpp>
#include <cppast/cpp_decltype_type.hpp>
#include <cppast/cpp_function_type.hpp>
#include <cppast/cpp_template.hpp>
#include <memory>
#include <stdlib.h>
#include <map>
#include <string>
#include <filesystem>
#include <fstream>
#include <vector>
#include <nlohmann/json.hpp>
#include <typeinfo>
#include "terra_node.hpp"
#include "terra_parser.hpp"
#include "terra_generator.hpp"
#include <variant>

namespace terra
{
    class RootParser : public Parser
    {
    private:
        std::vector<std::string> include_header_dirs_;
        ParseResult parse_result_;

        std::unique_ptr<cppast::cpp_file>
        parse_file(const cppast::libclang_compile_config &config,
                   const cppast::diagnostic_logger &logger,
                   const std::string &filename, bool fatal_error)
        {
            // the entity index is used to resolve cross references in the AST
            // we don't need that, so it will not be needed afterwards
            cppast::cpp_entity_index idx;
            // the parser is used to parse the entity
            // there can be multiple parser implementations
            cppast::libclang_parser parser(type_safe::ref(logger));
            // parse the file
            auto file = parser.parse(idx, filename, config);
            if (fatal_error && parser.error())
                return nullptr;
            return file;
        }

        void to_simple_type(SimpleType &type, const cppast::cpp_type &cpp_type, bool recursion = false)
        {
            std::cout << "------------" << cppast::to_string(cpp_type) << " >> " << std::to_string((int)cpp_type.kind()) << "\n";
            if (!recursion) {
                type.name = cppast::to_string(cpp_type);
                type.source = cppast::to_string(cpp_type);
                type.kind = SimpleTypeKind::value_t;
            }
                
            switch (cpp_type.kind())
            {
            case cppast::cpp_type_kind::builtin_t:
            {
                auto &cpp_builtin_type = static_cast<const cppast::cpp_builtin_type &>(cpp_type);
                type.name = cppast::to_string(cpp_builtin_type.builtin_type_kind());
                type.is_builtin_type = true;
                break;
            }
            case cppast::cpp_type_kind::user_defined_t:
            {
                auto &cpp_user_defined_type = static_cast<const cppast::cpp_user_defined_type &>(cpp_type);
                type.name = cpp_user_defined_type.entity().name();
                type.is_builtin_type = false;
                break;
            }
            case cppast::cpp_type_kind::auto_t:
                break;
            case cppast::cpp_type_kind::decltype_t:
            {
                auto &cpp_decltype_type = static_cast<const cppast::cpp_decltype_type &>(cpp_type);
                to_simple_type(type, cpp_decltype_type.expression().type(), true);
                break;
            }
            case cppast::cpp_type_kind::decltype_auto_t:
                break;
            case cppast::cpp_type_kind::cv_qualified_t:
            {
                auto &cpp_cv_qualified_type = static_cast<const cppast::cpp_cv_qualified_type &>(cpp_type);
                to_simple_type(type, cpp_cv_qualified_type.type(), true);
                type.is_const = cppast::is_const(cpp_cv_qualified_type.cv_qualifier());
                break;
            }
            case cppast::cpp_type_kind::pointer_t:
            {
                auto &cpp_pointer_type = static_cast<const cppast::cpp_pointer_type &>(cpp_type);
                to_simple_type(type, cpp_pointer_type.pointee(), true);
                type.kind = SimpleTypeKind::pointer_t;
                break;
            }
            case cppast::cpp_type_kind::reference_t:
            {
                auto &cpp_reference_type = static_cast<const cppast::cpp_reference_type &>(cpp_type);
                to_simple_type(type, cpp_reference_type.referee(), true);
                type.kind = SimpleTypeKind::reference_t;
                break;
            }
            case cppast::cpp_type_kind::array_t:
            {
                auto &cpp_array_type = static_cast<const cppast::cpp_array_type &>(cpp_type);
                to_simple_type(type, cpp_array_type.value_type(), true);
                type.kind = SimpleTypeKind::array_t;
                break;
            }
            case cppast::cpp_type_kind::function_t:
            {
                auto &cpp_function_type = static_cast<const cppast::cpp_function_type &>(cpp_type);
                type.name = cppast::to_string(cpp_type);
                type.kind = SimpleTypeKind::pointer_t;
                break;
            }
            case cppast::cpp_type_kind::member_function_t:
            {
                auto &cpp_member_function_type = static_cast<const cppast::cpp_member_function_type &>(cpp_type);
                type.name = cppast::to_string(cpp_type);
                type.kind = SimpleTypeKind::pointer_t;
                break;
            }
            case cppast::cpp_type_kind::member_object_t:
            {
                auto &cpp_member_object_type = static_cast<const cppast::cpp_member_object_type &>(cpp_type);
                to_simple_type(type, cpp_member_object_type.object_type(), true);
                break;
            }
            case cppast::cpp_type_kind::template_parameter_t:
            {
                auto &cpp_template_parameter_type = static_cast<const cppast::cpp_template_parameter_type &>(cpp_type);
                type.name = cpp_template_parameter_type.entity().name();
                type.kind = SimpleTypeKind::template_t;
                break;
            }
            case cppast::cpp_type_kind::template_instantiation_t:
            {
                auto &cpp_template_instantiation_type = static_cast<const cppast::cpp_template_instantiation_type &>(cpp_type);
                // if (cpp_template_instantiation_type.arguments().has_value()) {
                //     if (cpp_template_instantiation_type.arguments().value().size() == 1) {
                //         if (cpp_template_instantiation_type.arguments().value().begin()->type().has_value()) {
                //             to_simple_type(type, cpp_template_instantiation_type.arguments().value().begin()->type().value(), true);
                //             break;
                //         }
                //     }
                // }
                type.kind = SimpleTypeKind::template_t;
                break;
            }
            case cppast::cpp_type_kind::dependent_t:
            {
                auto &cpp_dependent_type = static_cast<const cppast::cpp_dependent_type &>(cpp_type);
                type.name = cpp_dependent_type.name();
                break;
            }
            case cppast::cpp_type_kind::unexposed_t:
            {
                auto &cpp_unexposed_type = static_cast<const cppast::cpp_unexposed_type &>(cpp_type);
                type.name = cpp_unexposed_type.name();
                break;
            }
            }
        }

        void parse_base_node(BaseNode &base_node, const std::vector<std::string> &namespaceList, const std::string &file_path, const cppast::cpp_entity &cpp_entity) {
            base_node.name = std::string(cpp_entity.name());
            base_node.namespaces = std::vector<std::string>(namespaceList);
            base_node.file_path = std::string(file_path);
            base_node.parent_name = cpp_entity.parent().value().name();
            base_node.attributes = std::vector<std::string>(parse_attributes(cpp_entity));
            base_node.comment = parse_comment(cpp_entity);
            // base_node.source = cppast::to_string(cpp_entity);
        }
       
        // public cpp_entity, public cpp_variable_base,
        template <typename T>
        void parse_parameter(Variable &parameter, const std::vector<std::string> &namespaceList, const std::string &file_path, const T &cpp_variable_base)
        {
            parse_base_node(parameter, namespaceList, file_path, cpp_variable_base);

            SimpleType param_type;
            to_simple_type(param_type, cpp_variable_base.type());
            parameter.type = param_type;

            std::string default_value = "";
            if (cpp_variable_base.default_value().has_value())
            {
                const cppast::cpp_expression &default_value_e = cpp_variable_base.default_value().value();
                if (default_value_e.kind() == cppast::cpp_expression_kind::literal_t)
                {
                    const cppast::cpp_literal_expression &cpp_literal_expression =
                        static_cast<const cppast::cpp_literal_expression &>(default_value_e);
                    default_value = cpp_literal_expression.value();
                }
                else
                {
                    const cppast::cpp_unexposed_expression &cpp_unexposed_expression =
                        static_cast<const cppast::cpp_unexposed_expression &>(default_value_e);
                    default_value = cpp_unexposed_expression.expression().as_string();
                }
            }
            parameter.default_value = default_value;
            
            std::cout << "param type:" << parameter.type.name << " " << parameter.type.kind << " " << parameter.type.is_builtin_type << ", name:" << parameter.name << ", default value: " << parameter.default_value << "\n";
        }

        void parse_member_variables(MemberVariable &member_variable, const std::vector<std::string> &namespaceList, const std::string &file_path, const cppast::cpp_member_variable &cpp_member_variable, std::string &current_access_specifier)
        {
            parse_base_node(member_variable, namespaceList, file_path, cpp_member_variable);

            SimpleType type;
            to_simple_type(type, cpp_member_variable.type());
            member_variable.type = type;
            member_variable.is_mutable = cpp_member_variable.is_mutable();
            member_variable.access_specifier = current_access_specifier;
        }

        void parse_method(MemberFunction &method, const std::vector<std::string> &namespaceList, const std::string &file_path, const cppast::cpp_member_function &cpp_member_function, std::string &current_access_specifier)
        {
            parse_base_node(method, namespaceList, file_path, cpp_member_function);
            
            method.is_virtual = cpp_member_function.is_virtual();
            SimpleType return_type;
            to_simple_type(return_type, cpp_member_function.return_type());
            method.return_type = return_type;
            for (auto &param : cpp_member_function.parameters())
            {
                Variable parameter;
                parse_parameter(parameter, namespaceList, file_path, param);

                method.parameters.push_back(parameter);
            }
            method.access_specifier = current_access_specifier;
            method.is_overriding = cppast::is_overriding(cpp_member_function.virtual_info());
            method.is_const = cpp_member_function.cv_qualifier() == cppast::cpp_cv::cpp_cv_const;
            method.signature = cpp_member_function.signature();
        }

        void parse_constructor(Constructor &constructor, const std::vector<std::string> &namespaceList, const std::string &file_path, const cppast::cpp_constructor &cpp_constructor)
        {
            parse_base_node(constructor, namespaceList, file_path, cpp_constructor);

            for (auto &param : cpp_constructor.parameters())
            {
                Variable parameter;
                parse_parameter(parameter, namespaceList, file_path, param);
                constructor.parameters.push_back(parameter);
            }
        }

        void parse_enum(Enumz &enumz, const std::vector<std::string> &namespaceList, const std::string &file_path, const cppast::cpp_enum &cpp_enum)
        {
            parse_base_node(enumz, namespaceList, file_path, cpp_enum);

            if (cpp_enum.scope_name().has_value())
            {
                std::cout << "enum value: " << cpp_enum.scope_name().value().name() << "\n";
            }

            std::cout << "enum: " << enumz.name << "\n";

            for (auto &en : cpp_enum)
            {
                EnumConstant enum_constant;
                enum_constant.name = en.name();
                enum_constant.parent_name = cpp_enum.name();
                if (en.value().has_value())
                {
                    const cppast::cpp_expression &cpp_expression = en.value().value();
                    if (cpp_expression.kind() == cppast::cpp_expression_kind::literal_t)
                    {
                        const cppast::cpp_literal_expression &cpp_literal_expression =
                            static_cast<const cppast::cpp_literal_expression &>(cpp_expression);
                        enum_constant.value = cpp_literal_expression.value();
                    }
                    else
                    {
                        const cppast::cpp_unexposed_expression &cpp_unexposed_expression =
                            static_cast<const cppast::cpp_unexposed_expression &>(cpp_expression);
                        enum_constant.value = cpp_unexposed_expression.expression().as_string();
                    }
                    enum_constant.source = enum_constant.value;
                }

                enumz.enum_constants.push_back(enum_constant);

                if (cpp_enum.parent().has_value())
                {
                    enumz.parent_name = cpp_enum.parent().value().name();
                }

                std::cout << "enum_constant: " << enum_constant.name << " = " << enum_constant.value << "\n";
            }
        }

        NodeType parse_type_alias(const cppast::cpp_type_alias &cpp_type_alias, const std::vector<std::string> &namespaceList, const std::string &file_path)
        {
            TypeAlias type_alias;
            parse_base_node(type_alias, namespaceList, file_path, cpp_type_alias);
            
            SimpleType st;
            to_simple_type(st, cpp_type_alias.underlying_type());
            type_alias.underlyingType = st;

            return type_alias;
        }

        NodeType parse_class(const cppast::cpp_class &cpp_class, const std::vector<std::string> &namespaceList, const std::string &file_path)
        {
            std::cout << "member of " << cpp_class.name() << "\n";
            std::string current_access_specifier;
            std::vector<Constructor> constructors;
            std::vector<MemberFunction> methods;
            std::vector<MemberVariable> member_variables;
            std::vector<std::string> base_clazzs;

            for (auto &base : cpp_class.bases())
            {
                // clazz->base_clazzs.push_back(std::string(base.name()));
                base_clazzs.push_back(std::string(base.name()));
            }

            for (auto &member : cpp_class)
            {
                std::cout << "member.name(): " << member.name() << " (" << cppast::to_string(member.kind()) << ")"
                          << "\n";

                auto member_kind = member.kind();
                if (member_kind == cppast::cpp_entity_kind::access_specifier_t)
                {
                    current_access_specifier = member.name();
                    continue;
                }

                switch (member_kind)
                {
                case cppast::cpp_entity_kind::constructor_t:
                {
                    auto &cpp_constructor = static_cast<const cppast::cpp_constructor &>(member);

                    Constructor constructor;
                    parse_constructor(constructor, namespaceList, file_path, cpp_constructor);
                    // clazz->constructors.push_back(constructor);
                    constructors.push_back(constructor);
                    break;
                }
                case cppast::cpp_entity_kind::member_function_t:
                {
                    auto &func = static_cast<const cppast::cpp_member_function &>(member);

                    MemberFunction method;
                    parse_method(method, namespaceList, file_path, func, current_access_specifier);
                    method.attributes = std::vector<std::string>(parse_attributes(member));

                    // clazz->methods.push_back(method);
                    methods.push_back(method);
                    break;
                }
                case cppast::cpp_entity_kind::member_variable_t:
                {
                    auto &cpp_member_variable = static_cast<const cppast::cpp_member_variable &>(member);
                    MemberVariable member_variable;
                    parse_member_variables(member_variable, namespaceList, file_path, cpp_member_variable, current_access_specifier);
                    // clazz->member_variables.push_back(member_variable);
                    member_variables.push_back(member_variable);
                    break;
                }
                case cppast::cpp_entity_kind::class_t:
                {
                }

                default:
                    break;
                }
            }

            std::cout << "[class_t] cpp_class: " << cpp_class.name() << std::endl;

            if (cpp_class.class_kind() == cppast::cpp_class_kind::struct_t)
            {
                Struct structt; // = new Struct();
                parse_base_node(structt, namespaceList, file_path, cpp_class);
                structt.constructors = std::vector<Constructor>(constructors);
                structt.methods = std::vector<MemberFunction>(methods);
                structt.member_variables = std::vector<MemberVariable>(member_variables);
                structt.base_clazzs = std::vector<std::string>(base_clazzs);
                return structt;
            }
            else
            {
                Clazz clazz; // = new Clazz();
                parse_base_node(clazz, namespaceList, file_path, cpp_class);
                clazz.constructors = std::vector<Constructor>(constructors);
                clazz.methods = std::vector<MemberFunction>(methods);
                clazz.member_variables = std::vector<MemberVariable>(member_variables);
                clazz.base_clazzs = std::vector<std::string>(base_clazzs);
                return clazz;
            }
        }

        std::vector<std::string> parse_attributes(const cppast::cpp_entity &entity)
        {
            const cppast::cpp_attribute_list &attributes = entity.attributes();

            std::vector<std::string> out_attrs;

            for (auto &attr : attributes)
            {
                if (attr.scope())
                {
                    std::string a = std::string(attr.scope().value() + "::" + attr.name());
                    std::cout << "attribute: " << a << std::endl;
                    out_attrs.push_back(a);
                }
                else
                {

                    std::string a = attr.name();

                    if (attr.arguments().has_value())
                    {
                        a += "(" + attr.arguments().value().as_string() + ")";
                    }

                    std::cout << "attribute: " << a << std::endl;

                    out_attrs.push_back(attr.name());
                }
            }

            return out_attrs;
        }

        std::string parse_comment(const cppast::cpp_entity &entity)
        {
            std::string comment = "";
            if (entity.comment().has_value())
            {
                comment = entity.comment().value();
            }

            return comment;
        }

        // prints the AST of a file
        void print_ast(std::ostream &out, const cppast::cpp_file &file)
        {
            // print file name
            std::cout << "AST for '" << file.name() << "':\n";

            auto file_path = std::string(file.name());
            CXXFile cxx_file{file_path};

            std::vector<std::string> namespaceList;

            // std::string prefix; // the current prefix string
            // recursively visit file and all children
            cppast::visit(
                file,
                [](const cppast::cpp_entity &e)
                {
                    // only visit non-templated class definitions that have the attribute set
                    return true;
                    //                (!cppast::is_templated(e) && e.kind() == cppast::cpp_entity_kind::class_t && cppast::is_definition(e))
                    //                       || e.kind() == cppast::cpp_entity_kind::enum_t
                    //                       // or all namespaces
                    //                       || e.kind() == cppast::cpp_entity_kind::namespace_t;
                },
                [&](const cppast::cpp_entity &e, const cppast::visitor_info &info)
                {
                    // std::cout << "entity name: " << e.name() << "kind: " << cppast::to_string(e.kind()) << std::endl;
                    if (e.kind() == cppast::cpp_entity_kind::include_directive_t)
                    {
                        auto &include_directive = static_cast<const cppast::cpp_include_directive &>(e);

                        IncludeDirective include_directive_ptr; // = new IncludeDirective();
                        include_directive_ptr.include_file_path = std::string(include_directive.full_path());

                        cxx_file.nodes.push_back(include_directive_ptr);
                    }

                    if (e.kind() == cppast::cpp_entity_kind::namespace_t)
                    {
                        auto &cpp_namespace = static_cast<const cppast::cpp_namespace &>(e);

                        if (info.event == cppast::visitor_info::container_entity_enter)
                        {
                            std::cout << "namespace.name(): " << cpp_namespace.name() << " (" << cppast::to_string(cpp_namespace.kind()) << ")"
                                      << "start\n";

                            namespaceList.push_back(cpp_namespace.name());
                        }
                        else if (info.event == cppast::visitor_info::container_entity_exit)
                        {
                            std::cout << "namespace.name(): " << cpp_namespace.name() << " (" << cppast::to_string(cpp_namespace.kind()) << ")"
                                      << "end\n";

                            namespaceList.pop_back();

                            std::vector<BaseNode> baseNode;
                            Clazz clazz;
                            baseNode.push_back(clazz);
                        }
                    }

                    if (e.kind() == cppast::cpp_entity_kind::type_alias_t)
                    {
                        auto &cpp_type_alias = static_cast<const cppast::cpp_type_alias &>(e);

                        if (cpp_type_alias.name().empty())
                        {
                            return false;
                        }

                        if (cxx_file.nodes.empty())
                        {
                            NodeType node = parse_type_alias(cpp_type_alias, namespaceList, file_path);
                            cxx_file.nodes.push_back(node);
                            std::cout << "[type_alias_t] type name: " << cpp_type_alias.name() << ", under type: " << cppast::to_string(cpp_type_alias.underlying_type())
                                      << std::endl;
                            return true;
                        }

                        auto &last_node = cxx_file.nodes.back();

                        if (std::holds_alternative<Enumz>(last_node))
                        {
                            auto &enumz = std::get<Enumz>(last_node);
                            if (enumz.name.empty())
                            {
                                enumz.name = cpp_type_alias.name();
                                std::cout << "[type_alias_t] enum name: " << enumz.name << std::endl;
                            }
                        }
                        else if (std::holds_alternative<Clazz>(last_node))
                        {
                            auto &clazz = std::get<Clazz>(last_node);
                            if (clazz.name.empty())
                            {
                                clazz.name = cpp_type_alias.name();
                                std::cout << "[type_alias_t] class name: " << clazz.name << std::endl;
                            }
                        }
                        else if (std::holds_alternative<Struct>(last_node))
                        {
                            auto &structt = std::get<Struct>(last_node);
                            if (structt.name.empty())
                            {
                                structt.name = cpp_type_alias.name();
                                std::cout << "[type_alias_t] struct name: " << structt.name << std::endl;
                            }
                        }
                        else
                        {
                            NodeType node = parse_type_alias(cpp_type_alias, namespaceList, file_path);
                            cxx_file.nodes.push_back(node);
                            std::cout << "[type_alias_t] type name: " << cpp_type_alias.name() << ", under type: " << cppast::to_string(cpp_type_alias.underlying_type())
                                      << std::endl;
                        }
                    }

                    if (e.kind() == cppast::cpp_entity_kind::class_t && !info.is_old_entity())
                    {
                        auto &cpp_class = static_cast<const cppast::cpp_class &>(e);

                        // Handle the pre-define class, e.g, class IRtcEngineEventHandlerEx;
                        if (cpp_class.begin() == cpp_class.end())
                        {
                            return true;
                        }

                        NodeType node = parse_class(cpp_class, namespaceList, file_path);
                        cxx_file.nodes.push_back(node);

                        return true;
                    }
                    else if (e.kind() == cppast::cpp_entity_kind::enum_t && !info.is_old_entity())
                    {
                        auto &cpp_enum = static_cast<const cppast::cpp_enum &>(e);
                        Enumz enumz; // = new Enumz();
                        parse_enum(enumz, namespaceList, file_path, cpp_enum);

                        cxx_file.nodes.push_back(enumz);

                        return true;
                    }
                    else if (e.kind() == cppast::cpp_entity_kind::variable_t && !info.is_old_entity())
                    {
                        std::cout << "cppast::cpp_entity_kind::variable_t: " << cppast::to_string(e.kind()) << " name: " << e.name() << std::endl;
                        auto &cpp_variable = static_cast<const cppast::cpp_variable &>(e);
                        Variable top_level_variable;
                        parse_parameter(top_level_variable, namespaceList, file_path, cpp_variable);

                        cxx_file.nodes.push_back(top_level_variable);
                        return true;
                    }
                    else if (e.kind() == cppast::cpp_entity_kind::unexposed_t && !info.is_old_entity())
                    {
                        std::cout << "cppast::cpp_entity_kind::unexposed_t: " << e.name() << std::endl;
                    }
                    else
                    {
                    }
                    return true;
                });

            std::cout << "AST for '" << file.name() << " end \n";
            parse_result_.cxx_files.push_back(cxx_file);
        }

    public:
        bool Parse(const ParseConfig &parse_config, ParseResult &parse_result) override
        {
            // auto include_header_dirs = chain.get()->parse_config.get()->include_header_dirs;
            // auto parse_files = chain.get()->parse_config.get()->parse_files;
            auto include_header_dirs = parse_config.include_header_dirs;
            auto parse_files = parse_config.parse_files;
            auto defines = parse_config.defines;
            // the compile config stores compilation flags
            cppast::libclang_compile_config config;
            //        config.add_include_dir("/Users/fenglang/codes/aw/Agora-Flutter/integration_test_app/iris_integration_test/third_party/agora/rtc/include");
            for (auto &dir : include_header_dirs)
            {
                config.add_include_dir(dir);
            }

            // config.write_preprocessed(true);
            // config.fast_preprocessing(true);
            for (auto &it : defines)
            {
                config.define_macro(it.first, it.second);
            }
            // the compile_flags are generic flags
            cppast::compile_flags flags;
            config.set_flags(cppast::cpp_standard::cpp_latest, flags);
            // the logger is used to print diagnostics
            cppast::stderr_diagnostic_logger logger;
            logger.set_verbose(true);

            // Temporay create windows.h file to to make the #define(_Win32) works fine
            // std::string windows_h_name = "windows.h";
            // std::ofstream windows_h_file(windows_h_name.c_str());

            for (auto &file : parse_files)
            {
                auto parsed_file = parse_file(config, logger, file, false);

                print_ast(std::cout, *parsed_file);
            }

            // parse_result_.cxx_files;

            // std::unique_ptr<ParseResult> result = chain.get()->Process(std::move(chain.get()->parse_config), std::unique_ptr<ParseResult>{&parse_result_});

            parse_result.cxx_files = std::vector<CXXFile>(parse_result_.cxx_files);

            return false;
        }
    };

    class DefaultVisitor
    {
    public:
        ParseResult parse_result_;

    private:
        std::vector<std::unique_ptr<Parser>> parsers_;
        RootParser root_parser_;

    public:
        DefaultVisitor() {}

        void AddParser(std::unique_ptr<Parser> parser)
        {
            parsers_.push_back(std::move(parser));
        }

        void Visit(const ParseConfig &parse_config)
        {
            root_parser_.Parse(parse_config, parse_result_);

            for (auto &parser : parsers_)
            {
                parser.get()->Parse(parse_config, parse_result_);
            }
        }

        void Accept(Generator *generator)
        {
            generator->Generate(parse_result_);
        }
    };

    class DefaultJsonGenerator : public Generator
    {
    private:
        std::string save_path_;

    public:
        DefaultJsonGenerator(std::string save_path) : save_path_(save_path) {}

        bool Generate(const ParseResult &parse_result) override
        {

            auto cxx_files = parse_result.cxx_files;
            nlohmann::json cxx_files_json;

            for (auto cxx_file : cxx_files)
            {
                auto file_path = cxx_file.file_path;
                std::string::size_type iPos = file_path.find_last_of('/') + 1;
                std::string filename = file_path.substr(iPos, file_path.length() - iPos);

                nlohmann::json fileJson;
                fileJson["file_path"] = cxx_file.file_path;
                fileJson["__TYPE"] = __TYPE_CXXFile;

                nlohmann::json nodesJson;

                for (auto node : cxx_file.nodes)
                {
                    nlohmann::json eleJson;

                    if (std::holds_alternative<IncludeDirective>(node))
                    {
                        auto &ele = std::get<IncludeDirective>(node);
                        IncludeDirective2Json(&ele, eleJson);
                    }
                    if (std::holds_alternative<TypeAlias>(node))
                    {
                        auto &ele = std::get<TypeAlias>(node);
                        TypeAlias2Json(&ele, eleJson);
                    }
                    if (std::holds_alternative<Clazz>(node))
                    {
                        auto &ele = std::get<Clazz>(node);
                        Clazz2Json(&ele, eleJson);
                    }
                    if (std::holds_alternative<Struct>(node))
                    {
                        auto &ele = std::get<Struct>(node);
                        Struct2Json(&ele, eleJson);
                    }
                    if (std::holds_alternative<Enumz>(node))
                    {
                        auto &ele = std::get<Enumz>(node);
                        Enumz2Json(&ele, eleJson);
                    }
                    if (std::holds_alternative<Variable>(node))
                    {
                        auto &ele = std::get<Variable>(node);
                        Variable2Json(&ele, eleJson);
                    }

                    nodesJson.push_back(eleJson);
                }

                fileJson["nodes"] = nodesJson;

                cxx_files_json.push_back(fileJson);
            }

            std::string jsonPath = this->save_path_;
            std::ofstream osWrite(jsonPath, std::ofstream::trunc);
            osWrite << cxx_files_json.dump();
            osWrite.flush();
            osWrite.close();

            std::cout << "Dump C++ header files json to " << jsonPath.c_str() << std::endl;
            return true;
        }

    private:
        const std::string __TYPE_CXXFile = "CXXFile";
        const std::string __TYPE_IncludeDirective = "IncludeDirective";
        const std::string __TYPE_TypeAlias = "TypeAlias";
        const std::string __TYPE_Clazz = "Clazz";
        const std::string __TYPE_Constructor = "Constructor";
        const std::string __TYPE_Struct = "Struct";
        const std::string __TYPE_MemberFunction = "MemberFunction";
        const std::string __TYPE_Variable = "Variable";
        const std::string __TYPE_SimpleType = "SimpleType";
        const std::string __TYPE_MemberVariable = "MemberVariable";
        const std::string __TYPE_EnumConstant = "EnumConstant";
        const std::string __TYPE_Enumz = "Enumz";

        void BaseNode2Json(BaseNode *node, nlohmann::json &json)
        {

            json["name"] = node->name;

            if (node->namespaces.size() <= 0)
            {
                json["namespaces"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json namespacesJson;
                for (auto name : node->namespaces)
                {
                    namespacesJson.push_back(name);
                }
                json["namespaces"] = namespacesJson;
            }

            json["file_path"] = node->file_path;
            json["parent_name"] = node->parent_name;
            json["attributes"] = node->attributes;
            json["comment"] = node->comment;
            json["source"] = node->source;
        }

        void IncludeDirective2Json(IncludeDirective *node, nlohmann::json &json)
        {
            BaseNode2Json(node, json);
            json["__TYPE"] = __TYPE_IncludeDirective;
            json["include_file_path"] = node->include_file_path;
        }

        void TypeAlias2Json(TypeAlias *node, nlohmann::json &json)
        {
            BaseNode2Json(node, json);
            json["__TYPE"] = __TYPE_TypeAlias;
            nlohmann::json typeJson;
            SimpleType2Json(&node->underlyingType, typeJson);
            json["underlyingType"] = typeJson;
        }

        void Constructor2Json(Constructor *node, nlohmann::json &json)
        {

            json["__TYPE"] = __TYPE_Constructor;
            json["name"] = node->name;

            if (node->parameters.size() <= 0)
            {
                json["parameters"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json parametersJson;
                for (auto &param : node->parameters)
                {
                    nlohmann::json paramJson;
                    Variable2Json(&param, paramJson);
                    parametersJson.push_back(paramJson);
                }
                json["parameters"] = parametersJson;
            }
        }

        void Clazz2Json(Clazz *node, nlohmann::json &json)
        {

            json["__TYPE"] = __TYPE_Clazz;

            BaseNode2Json(node, json);
            if (node->constructors.size() <= 0)
            {
                json["constructors"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json constructorsJson;
                for (auto &constructor : node->constructors)
                {
                    nlohmann::json constructorJson;
                    Constructor2Json(&constructor, constructorJson);
                    constructorsJson.push_back(constructorJson);
                }
                json["constructors"] = constructorsJson;
            }

            if (node->methods.size() <= 0)
            {
                json["methods"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json methodsJson;
                for (auto &method : node->methods)
                {
                    nlohmann::json methodJson;
                    MemberFunction2Json(&method, methodJson);
                    methodsJson.push_back(methodJson);
                }
                json["methods"] = methodsJson;
            }

            if (node->member_variables.size() <= 0)
            {
                json["member_variables"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json member_variablesJson;
                for (auto &member_variable : node->member_variables)
                {
                    nlohmann::json member_variableJson;
                    MemberVariable2Json(&member_variable, member_variableJson);
                    member_variablesJson.push_back(member_variableJson);
                }
                json["member_variables"] = member_variablesJson;
            }

            if (node->base_clazzs.size() <= 0)
            {
                json["base_clazzs"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json base_clazzsJson;
                for (auto &base_clazz : node->base_clazzs)
                {
                    base_clazzsJson.push_back(base_clazz);
                }
                json["base_clazzs"] = base_clazzsJson;
            }
        }

        void Struct2Json(Struct *node, nlohmann::json &json)
        {
            Clazz2Json(node, json);
            json["__TYPE"] = __TYPE_Struct;
        }

        void Enumz2Json(Enumz *node, nlohmann::json &json)
        {
            BaseNode2Json(node, json);
            json["__TYPE"] = __TYPE_Enumz;

            if (node->enum_constants.size() <= 0)
            {
                json["enum_constants"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json enum_constantsJson;
                for (auto &enum_constant : node->enum_constants)
                {
                    nlohmann::json enum_constantJson;
                    EnumConstant2Json(&enum_constant, enum_constantJson);
                    enum_constantsJson.push_back(enum_constantJson);
                }
                json["enum_constants"] = enum_constantsJson;
            }
        }

        void MemberFunction2Json(MemberFunction *node, nlohmann::json &json)
        {

            BaseNode2Json(node, json);
            json["__TYPE"] = __TYPE_MemberFunction;
            json["is_virtual"] = node->is_virtual;

            nlohmann::json returnTypeJson;
            SimpleType2Json(&node->return_type, returnTypeJson);
            json["return_type"] = returnTypeJson;

            if (node->parameters.size() <= 0)
            {
                json["parameters"] = nlohmann::json::parse("[]");
            }
            else
            {
                nlohmann::json parametersJson;
                for (auto &param : node->parameters)
                {
                    nlohmann::json paramJson;
                    Variable2Json(&param, paramJson);
                    parametersJson.push_back(paramJson);
                }
                json["parameters"] = parametersJson;
            }

            json["access_specifier"] = node->access_specifier;
            json["is_overriding"] = node->is_overriding;
            json["is_const"] = node->is_const;
            json["signature"] = node->signature;
        }

        void Variable2Json(Variable *node, nlohmann::json &json)
        {

            json["__TYPE"] = __TYPE_Variable;

            json["name"] = node->name;
            nlohmann::json typeJson;
            SimpleType2Json(&node->type, typeJson);
            json["type"] = typeJson;

            json["default_value"] = node->default_value;
            json["is_output"] = node->is_output;
        }

        void SimpleType2Json(SimpleType *node, nlohmann::json &json)
        {
            json["__TYPE"] = __TYPE_SimpleType;
            json["name"] = node->name;
            json["source"] = node->source;
            json["kind"] = (int)node->kind;
            json["is_const"] = node->is_const;
            json["is_builtin_type"] = node->is_builtin_type;
        }

        void MemberVariable2Json(MemberVariable *node, nlohmann::json &json)
        {
            json["__TYPE"] = __TYPE_MemberVariable;
            json["name"] = node->name;

            nlohmann::json typeJson;
            SimpleType2Json(&node->type, typeJson);
            json["type"] = typeJson;

            json["is_mutable"] = node->is_mutable;
            json["access_specifier"] = node->access_specifier;
        }

        void EnumConstant2Json(EnumConstant *node, nlohmann::json &json)
        {
            json["__TYPE"] = __TYPE_EnumConstant;
            json["name"] = node->name;
            json["value"] = node->value;
            json["source"] = node->source;
        }
    };

    class DefaultGenerator : public Generator
    {
    private:
        std::string output_dir_;
        std::unique_ptr<SyntaxRender> syntax_render_;

    public:
        // void SetSyntaxRender(std::unique_ptr<SyntaxRender> syntax_render)
        // {
        //     syntax_render_ = std::move(syntax_render);
        // }

        DefaultGenerator(std::string output_dir, std::unique_ptr<SyntaxRender> syntax_render) : output_dir_(output_dir), syntax_render_(std::move(syntax_render)) {}

        bool Generate(const ParseResult &parse_result) override
        {
            syntax_render_.get()->SetParseResult(parse_result);
            syntax_render_.get()->OnRenderFilesStart(parse_result, output_dir_);

            for (auto &file : parse_result.cxx_files)
            {
                syntax_render_.get()->Render(parse_result, file, output_dir_);
            }

            syntax_render_.get()->OnRenderFilesEnd(parse_result, output_dir_);

            return true;
        }
    };
}

#endif // terra_H_