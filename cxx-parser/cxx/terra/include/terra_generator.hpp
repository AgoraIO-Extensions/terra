#ifndef terra_GENERATOR_H_
#define terra_GENERATOR_H_

namespace terra
{

    class Generator
    {
    public:
        virtual ~Generator() = default;

        virtual bool Generate(const ParseResult &parse_result) = 0;
    };

    class SyntaxRender
    {
    private:
        ParseResult parse_result_;

    public:
        // template <typename T>
        class RenderedBlock
        {
        public:
            // T original_node;
            std::string rendered_content;
        };

        SyntaxRender() {}
        ~SyntaxRender() {}

        virtual void SetParseResult(ParseResult parse_result)
        {
            parse_result_ = parse_result;
        }

        virtual void OnRenderFilesStart(const ParseResult &parse_result, const std::string &output_dir) {}

        virtual void OnRenderFilesEnd(const ParseResult &parse_result, const std::string &output_dir) {}

        virtual void Render(const ParseResult &parse_result, const CXXFile &file, const std::string &output_dir)
        {

            if (!ShouldRender(file))
            {
                return;
            }

            std::vector<SyntaxRender::RenderedBlock> file_render_blocks;

            std::vector<IncludeDirective> include_directives;
            for (auto &node : file.nodes)
            {
                if (std::holds_alternative<IncludeDirective>(node))
                {
                    IncludeDirective include_directive = std::get<IncludeDirective>(node);
                    include_directives.push_back(include_directive);
                }
                else
                {
                    break;
                }
            }

            file_render_blocks.push_back(RenderIncludeDirectives(file, include_directives));

            for (auto &node : file.nodes)
            {
                if (std::holds_alternative<IncludeDirective>(node))
                {
                    // IncludeDirective include_directive = std::get<IncludeDirective>(node);
                    // file_render_blocks.push_back(RenderIncludeDirectives(include_directive));
                }
                else if (std::holds_alternative<Clazz>(node))
                {
                    std::vector<SyntaxRender::RenderedBlock> class_members_block;
                    Clazz clazz = std::get<Clazz>(node);

                    for (auto &constructor : clazz.constructors)
                    {
                        class_members_block.push_back(RenderClassConstructor(clazz, constructor));
                    }

                    for (auto &member_variable : clazz.member_variables)
                    {
                        class_members_block.push_back(RenderMemberVariable(node, member_variable));
                    }

                    for (auto &method : clazz.methods)
                    {
                        class_members_block.push_back(RenderMemberFunction(node, method));
                    }

                    file_render_blocks.push_back(RenderClass(clazz, class_members_block));
                }
                else if (std::holds_alternative<Struct>(node))
                {
                    std::vector<SyntaxRender::RenderedBlock> class_members_block;
                    Struct structt = std::get<Struct>(node);

                    for (auto &constructor : structt.constructors)
                    {
                        class_members_block.push_back(RenderStructConstructor(structt, constructor));
                    }

                    for (auto &member_variable : structt.member_variables)
                    {
                        class_members_block.push_back(RenderMemberVariable(node, member_variable));
                    }

                    for (auto &method : structt.methods)
                    {
                        class_members_block.push_back(RenderMemberFunction(node, method));
                    }

                    file_render_blocks.push_back(RenderStruct(structt, class_members_block));
                }
                else if (std::holds_alternative<Enumz>(node))
                {
                    std::vector<SyntaxRender::RenderedBlock> enum_consts_block;
                    Enumz enumz = std::get<Enumz>(node);

                    for (auto &enum_const : enumz.enum_constants)
                    {
                        enum_consts_block.push_back(RenderEnumConstant(enum_const));
                    }

                    file_render_blocks.push_back(RenderEnum(enumz, enum_consts_block));
                }
                else if (std::holds_alternative<Variable>(node))
                {
                    const Variable &top_level_variable = std::get<Variable>(node);
                    file_render_blocks.push_back(RenderTopLevelVariable(top_level_variable));
                }
                else
                {
                }
            }

            file_render_blocks.push_back(RenderFileEnd(file));

            std::string file_contents = "";
            int i = 0;
            for (auto &block : file_render_blocks)
            {
                ++i;
                if (!block.rendered_content.empty()) {
                    file_contents += block.rendered_content;
                    if (i != file_render_blocks.size())
                        file_contents += "\n";
                }
            }

            std::filesystem::path outdir(output_dir);
            std::filesystem::path outfile(RenderedFileName(file.file_path).rendered_content);
            std::filesystem::path full_path = outdir / outfile;

            std::string parent_path = full_path.parent_path().u8string();

            if (!std::filesystem::exists(parent_path))
            {                                                   // Check if src folder exists
                std::filesystem::create_directory(parent_path); // create src folder
            }

            SaveRenderBlocks(output_dir, full_path.c_str(), file_contents);

            FormatCode(full_path.c_str());
        }

    protected:
        const ParseResult &GetParseResult()
        {
            return parse_result_;
        }

        virtual bool ShouldRender(const CXXFile &file)
        {
            return false;
        }

        virtual RenderedBlock RenderedFileName(const std::string &file_path)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderIncludeDirectives(const CXXFile &file, const std::vector<IncludeDirective> &include_directives)
        {
            RenderedBlock block;
            return block;
        }

        // virtual RenderedBlock RenderConstructor(const Constructor &constructor) = 0;

        virtual RenderedBlock RenderStructConstructor(const Struct &structt, const Constructor &constructor)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderClassConstructor(const Clazz &clazz, const Constructor &constructor)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderMemberVariable(const NodeType &parent, const MemberVariable &member_variable)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderMemberFunction(const NodeType &parent, const MemberFunction &member_function)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderClass(const Clazz &original_clazz, const std::vector<RenderedBlock> &rendered_class_members)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderStruct(const Struct &original_struct, const std::vector<RenderedBlock> &rendered_struct_members)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderEnumConstant(const EnumConstant &enum_const)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderEnum(const Enumz &enumz, const std::vector<RenderedBlock> &rendered_enum_consts)
        {
            RenderedBlock block;
            return block;
        }

        virtual RenderedBlock RenderTopLevelVariable(const Variable &top_level_variable)
        {
            RenderedBlock render_block;
            return render_block;
        }

        virtual RenderedBlock RenderFileEnd(const CXXFile &file)
        {
            RenderedBlock block;
            return block;
        }

        virtual void FormatCode(const std::string &file_path) {}

        virtual void SaveRenderBlocks(const std::string &output_dir, const std::string &full_path, const std::string &render_contents)
        {
            std::ofstream fileSink;
            fileSink.open(full_path.c_str());
            fileSink << render_contents;
            fileSink.flush();
        }
    };

}

#endif // terra_GENERATOR_H_