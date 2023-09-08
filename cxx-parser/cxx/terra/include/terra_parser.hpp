#ifndef terra_PARSER_H_
#define terra_PARSER_H_

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
#include "terra_node.hpp"

namespace terra
{

    typedef struct ParseConfig
    {
        std::vector<std::string> include_header_dirs;
        std::vector<std::string> parse_files;
        std::map<std::string, std::string> defines;
    } ParseConfig;

    typedef struct ParseResult
    {
        std::vector<CXXFile> cxx_files;
    } ParseResult;

    // class Parser
    // {
    // public:
    //     class ParseInterceptor
    //     {
    //     public:
    //         ParseResult original_parse_result;
    //         ParseResult processed_result;
    //         ParseConfig parse_config;

    //         virtual bool intercept(const ParseConfig &parse_config, ParseResult &parse_result) = 0;
    //     };

    //     virtual ParseResult Parse(std::unique_ptr<Chain> chain) = 0;
    // };

    class Parser
    {
    public:
        // ParseResult original_parse_result;
        // ParseResult processed_result;
        // ParseConfig parse_config;

        virtual bool Parse(const ParseConfig &parse_config, ParseResult &parse_result) = 0;
    };
}

#endif // terra_PARSER_H_