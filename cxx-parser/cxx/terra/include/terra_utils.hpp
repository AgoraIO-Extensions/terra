#ifndef TERRA_UTILS_H_
#define TERRA_UTILS_H_

#include <filesystem>
#include <iostream>
#include <regex>
#include <stdlib.h>
#include <string>
#include <vector>
#include <sstream>

namespace terra
{

    bool Replace(std::string &str, const std::string &from, const std::string &to)
    {
        size_t start_pos = str.find(from);
        if (start_pos == std::string::npos)
            return false;
        str.replace(start_pos, from.length(), to);
        return true;
    }

    std::string_view ltrim(std::string_view s)
    {
        s.remove_prefix(
            std::distance(s.cbegin(), std::find_if(s.cbegin(), s.cend(), [](int c)
                                                   { return !std::isspace(c); })));

        return s;
    }

    std::string_view rtrim(std::string_view s)
    {
        s.remove_suffix(std::distance(s.crbegin(),
                                      std::find_if(s.crbegin(), s.crend(), [](int c)
                                                   { return !std::isspace(c); })));

        return s;
    }

    std::string_view trim(std::string_view s) { return ltrim(rtrim(s)); }

    /// Handle conditional conditional compilation directives infos.
    void PreProcessVisitFiles(const std::filesystem::path &work_dir,
                              const std::vector<std::string> &visit_files,
                              std::vector<std::string> &pre_processed_files,
                              bool render_ifdefine_macros = false)
    {
        // std::filesystem::path tmp_path = std::filesystem::current_path() / "tmp";
        if (std::filesystem::exists(work_dir))
        {
            std::filesystem::remove_all(work_dir);
        }
        std::filesystem::create_directories(work_dir);

        for (auto &visit_file : visit_files)
        {
            std::filesystem::path visit_fie_path(visit_file);
            std::filesystem::path new_visit_file_path =
                work_dir / visit_fie_path.filename();
            pre_processed_files.push_back(new_visit_file_path.c_str());

            std::ifstream visit_file_ifs(visit_file);

            if (visit_file_ifs.is_open())
            {
                std::ofstream new_visit_file_ofs{new_visit_file_path.c_str()};

                std::vector<std::string> ifdefine_macros;

                std::string line;
                std::vector<std::string> file_lines;
                while (std::getline(visit_file_ifs, line))
                {
                    file_lines.push_back(line);
                }

                int file_line_start = 0;
                int file_line_end = file_lines.size();
                for (int i = 0; i < file_lines.size(); i++)
                {
                    std::string &l = file_lines[i];

                    if (l.find("#") == std::string::npos)
                    {
                        continue;
                    }

                    if (l.find("#pragma once") != std::string::npos)
                    {
                        file_line_start = i;
                        break;
                    }

                    if (l.find("#ifndef") != std::string::npos && file_lines[i + 1].find("#define") != std::string::npos)
                    {
                        // && file_lines[file_lines.size()].find("#define") != std::string::npos
                        file_line_start = i + 2;

                        for (int j = file_lines.size(); j >= 0; j--)
                        {

                            std::string &ll = file_lines[j];
                            if (ll.find("#endif") != std::string::npos)
                            {
                                file_line_end = j;
                                break;
                            }
                        }

                        break;
                    }

                    break;
                }

                bool isCommentScopeStart = false;
                bool isReverseCondition = false;
                for (int index = 0; index < file_lines.size();)
                {
                    line = file_lines[index];
                    if (index < file_line_start)
                    {
                        new_visit_file_ofs << line;
                        new_visit_file_ofs << "\n";
                        index++;
                        continue;
                    }
                    if (index >= file_line_end)
                    {
                        new_visit_file_ofs << line;
                        new_visit_file_ofs << "\n";
                        index++;
                        continue;
                    }

                    if (line.find("/*") != std::string::npos)
                    {
                        isCommentScopeStart = true;
                    }
                    if (line.find("*/") != std::string::npos)
                    {
                        isCommentScopeStart = false;
                    }

                    if (line.find("#if") != std::string::npos)
                    { // pos=0 limits the search to the prefix
                        // s starts with prefix
                        ifdefine_macros.push_back(line);
                        if (line.find("#ifndef") == std::string::npos)
                        {
                            if (line.rfind('\\') != std::string::npos)
                            {
                                int tempIndex = index + 1;
                                while (tempIndex < file_line_end)
                                {
                                    std::string l = file_lines[tempIndex];

                                    std::string lastLine = ifdefine_macros.back();
                                    auto position = lastLine.rfind('\\');
                                    if (position != std::string::npos)
                                    {
                                        lastLine = lastLine.erase(position, 1);
                                    }

                                    std::string temp = lastLine + l;
                                    temp.erase(std::remove(temp.begin(), temp.end(), '\n'),
                                               temp.end());
                                    temp.erase(std::remove(temp.begin(), temp.end(), '\r'),
                                               temp.end());
                                    ifdefine_macros.pop_back();
                                    ifdefine_macros.push_back(temp);
                                    if (l.rfind('\\') == std::string::npos)
                                    {
                                        break;
                                    }
                                    ++tempIndex;
                                }
                                index = tempIndex;
                            }

                            ++index;
                            continue;
                        }
                    }

                    if ((line.find("#else") != std::string::npos || line.find("#elif") != std::string::npos) && ifdefine_macros.back().find("#if") != std::string::npos)
                    { // pos=0 limits the search to the prefix
                        // s starts with prefix
                        isReverseCondition = true;
                        ++index;
                        continue;
                    }

                    if (line.find("#endif") != std::string::npos)
                    { // pos=0 limits the search to the prefix
                        std::string last_ifdefine_macro = ifdefine_macros.back();
                        ifdefine_macros.pop_back();
                        if ((last_ifdefine_macro.find("#if") != std::string::npos && last_ifdefine_macro.find("#ifndef") == std::string::npos))
                        {
                            isReverseCondition = false;
                            index++;
                            continue;
                        }
                    }

                    if (render_ifdefine_macros)
                    {
                        bool shouldWrite = !isCommentScopeStart && !trim(line).empty() && line.find("*/") == std::string::npos;
                        if (shouldWrite)
                        {
                            if (!ifdefine_macros.empty())
                            {
                                std::string mc = "";
                                for (auto &m : ifdefine_macros)
                                {
                                    std::string tmp = m;
                                    // TODO(littlegnal): Temporarily reverse the `#if defined(...)` codition to `#if !(defined(...))` at this time,
                                    // still need to investigate a more accurate way to handle the compilation directives
                                    if (isReverseCondition && tmp.find("#ifndef") == std::string::npos)
                                    {
                                        Replace(tmp, "#if", "");
                                        Replace(tmp, "\n", "");
                                        Replace(tmp, "\r", "");

                                        tmp = "#if !(" + tmp + ")";
                                    }
                                    else
                                    {
                                    }
                                    mc += "/// " + tmp + "\n";
                                }

                                new_visit_file_ofs << mc;
                            }
                        }
                    }

                    new_visit_file_ofs << line;
                    new_visit_file_ofs << "\n";

                    index++;
                }

                new_visit_file_ofs.flush();

                visit_file_ifs.close();
                new_visit_file_ofs.close();
            }
        }

        // std::filesystem:: ::copy("sandbox/file1.txt", "sandbox/file2.txt");
    };

    std::vector<std::string> Split(const std::string &source,
                                   const std::string &delimelater)
    {

        std::vector<std::string> result;
        if (source.empty())
            return result;
        std::string::size_type pos1 = 0;
        std::string::size_type pos2 = 0;
        while ((pos2 = source.find(delimelater, pos1)) != std::string::npos)
        {
            result.push_back(source.substr(pos1, pos2 - pos1));
            pos1 = pos2 + delimelater.size();
        }
        result.push_back(source.substr(pos1));

        return result;
    }

    std::string JoinToString(const std::vector<std::string> &list, const std::string &delimelater)
    {
        if (list.empty())
            return "";

        std::ostringstream vts;
        std::copy(list.begin(), list.end() - 1,
                  std::ostream_iterator<std::string>(vts, delimelater.c_str()));
        vts << list.back();
        return vts.str();
    }

} // namespace terra

#endif // TERRA_UTILS_H_
