//
// Created by LXH on 2022/7/27.
//

#ifndef AGORA_RTC_AST_UTILS_HPP
#define AGORA_RTC_AST_UTILS_HPP

#include <filesystem>
#include <iostream>
#include <regex>
#include <stdlib.h>
#include <string>
#include <vector>

void PreProcessVisitFiles(const std::filesystem::path &work_dir,
                          const std::vector<std::string> &visit_files,
                          std::vector<std::string> &pre_processed_files,
                          bool render_ifdefine_macros = false) {
  // std::filesystem::path tmp_path = std::filesystem::current_path() / "tmp";
  if (std::filesystem::exists(work_dir)) {
    std::filesystem::remove_all(work_dir);
  }
  std::filesystem::create_directories(work_dir);

  for (auto &visit_file : visit_files) {
    std::filesystem::path visit_fie_path(visit_file);
    std::filesystem::path new_visit_file_path =
        work_dir / visit_fie_path.filename();
    pre_processed_files.push_back(new_visit_file_path.c_str());

    std::ifstream visit_file_ifs(visit_file);

    if (visit_file_ifs.is_open()) {
      std::ofstream new_visit_file_ofs{new_visit_file_path.c_str()};

      std::vector<std::string> ifdefine_macros;

      std::string line;
      std::vector<std::string> file_lines;
      while (std::getline(visit_file_ifs, line)) { file_lines.push_back(line); }

      int file_line_start = 0;
      int file_line_end = file_lines.size();
      for (int i = 0; i < file_lines.size(); i++) {
        std::string &l = file_lines[i];

        if (l.find("#") == std::string::npos) { continue; }

        if (l.find("#pragma once") != std::string::npos) {
          file_line_start = i;
          break;
        }

        if (l.find("#ifndef") != std::string::npos
            && file_lines[i + 1].find("#define") != std::string::npos) {
          // && file_lines[file_lines.size()].find("#define") != std::string::npos
          file_line_start = i + 2;

          for (int j = file_lines.size(); j >= 0; j--) {

            std::string &ll = file_lines[j];
            if (ll.find("#endif") != std::string::npos) {
              file_line_end = j;
              break;
            }
          }

          break;
        }

        break;
      }

      for (int index = 0; index < file_lines.size();) {
        line = file_lines[index];
        if (index < file_line_start) {
          new_visit_file_ofs << line;
          new_visit_file_ofs << "\n";
          index++;
          continue;
        }
        if (index >= file_line_end) {
          new_visit_file_ofs << line;
          new_visit_file_ofs << "\n";
          index++;
          continue;
        }

        // line = file_lines[index];
        // std::regex pattern = std::regex("#if.*(buffer|data)$");
        //   std::smatch output;
        //   std::string name_lower = BaseSyntaxRender::ToLower(it.name);
        //   if (std::regex_match(name_lower, output, pattern)) {
        //     it.type.name = "uint8_t";
        //     it.type.kind = terra::array_t;
        //     continue;
        //   }

        if (line.find("#if")
            != std::string::npos) {// pos=0 limits the search to the prefix
          // s starts with prefix
          ifdefine_macros.push_back(line);
          if (line.find("#ifndef") == std::string::npos) {
            if (line.rfind('\\') != std::string::npos) {
              int tempIndex = index + 1;
              while (tempIndex < file_line_end) {
                std::string l = file_lines[tempIndex];

                std::string lastLine = ifdefine_macros.back();
                auto position = lastLine.rfind('\\');
                if (position != std::string::npos) {
                  lastLine = lastLine.erase(position, 1);
                }

                std::string temp = lastLine + l;
                temp.erase(std::remove(temp.begin(), temp.end(), '\n'),
                           temp.end());
                temp.erase(std::remove(temp.begin(), temp.end(), '\r'),
                           temp.end());
                ifdefine_macros.pop_back();
                ifdefine_macros.push_back(temp);
                if (l.rfind('\\') == std::string::npos) { break; }
                ++tempIndex;
              }
              index = tempIndex;
            }

            ++index;
            continue;
          }
        }

        if ((line.find("#else") != std::string::npos
             || line.find("#elif") != std::string::npos)
            && ifdefine_macros.back().find("#if")
                != std::string::npos) {// pos=0 limits the search to the prefix
          // s starts with prefix
          ++index;
          continue;
        }

        if (line.find("#endif")
            != std::string::npos) {// pos=0 limits the search to the prefix
          std::string last_ifdefine_macro = ifdefine_macros.back();
          ifdefine_macros.pop_back();
          if ((last_ifdefine_macro.find("#if") != std::string::npos
               && last_ifdefine_macro.find("#ifndef") == std::string::npos)) {
            index++;
            continue;
          }
        }

        if (render_ifdefine_macros) {
          const std::regex base_regex(
              R"(\s*virtual\s([A-Za-z0-9_\*]+)\s([A-Za-z0-9_]+)\([\s\S]*)");
          std::smatch base_match;
          if (std::regex_match(line, base_match, base_regex)) {
            if (!ifdefine_macros.empty()) {
              std::string mc = "";
              for (auto &m : ifdefine_macros) { mc += "/// " + m + "\n"; }

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
                               const std::string &delimelater) {

  std::vector<std::string> result;
  if (source.empty()) return result;
  std::string::size_type pos1 = 0;
  std::string::size_type pos2 = 0;
  while ((pos2 = source.find(delimelater, pos1)) != std::string::npos) {
    result.push_back(source.substr(pos1, pos2 - pos1));
    pos1 = pos2 + delimelater.size();
  }
  result.push_back(source.substr(pos1));

  return result;
}

#endif// AGORA_RTC_AST_UTILS_HPP
