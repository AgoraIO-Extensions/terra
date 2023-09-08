#include "terra.hpp"
#include "utils.hpp"
#include <cxxopts.hpp>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <map>
#include <memory>
#include <regex>
#include <stdlib.h>
#include <string>

using namespace terra;
void DumpJson(const std::vector<std::string> &include_header_dirs,
              const std::vector<std::string> &pre_processed_files,
              const std::map<std::string, std::string> &defines,
              const std::string &output_dir) {
  DefaultVisitor rootVisitor;
  ParseConfig parse_config{include_header_dirs, pre_processed_files, defines};
  rootVisitor.Visit(parse_config);

  auto default_generator = std::make_unique<DefaultJsonGenerator>(output_dir);

  rootVisitor.Accept(default_generator.get());
}

int main(int argc, char **argv) {
  cxxopts::Options option_list("iris-ast", "iris ast");

  // clang-format off
    option_list.add_options()
        ("include-header-dirs", "The include C++ headers directories, split with \",\"", cxxopts::value<std::string>())
        ("output-dir", "The output directory, or output to ./build/iris-ast/ by default", cxxopts::value<std::string>())
        ("visit-headers", "The C++ headers to be visited, split with \",\"", cxxopts::value<std::string>())
        ("custom-headers", "The custom C++ headers to be visited, split with \",\"", cxxopts::value<std::string>())
        ("defines-macros", "Custom macros, split with \",\"", cxxopts::value<std::string>())
        ("dump-json", "Only dump the C++ header files to json");
  // clang-format on

  auto parse_result = option_list.parse(argc, argv);

  std::string output_dir = "";
  std::string visit_headers = "";
  std::vector<std::string> include_header_dirs;
  std::vector<std::string> visit_files;
  std::vector<std::string> custom_headers;
  bool is_dump_json = false;

  std::map<std::string, std::string> defines = {
      {"__GLIBC_USE\(...\)", "0"},
      {"__GNUC_PREREQ\(...\)", "0"},
      {"__GLIBC_PREREQ\(...\)", "0"},
      {"__glibc_clang_prereq\(...\)", "0"}};

  std::string project_path = std::filesystem::current_path();

  if (parse_result.count("output-dir")) {
    output_dir = parse_result["output-dir"].as<std::string>();
  } else {
    std::filesystem::path tmp_out{"build/iris-ast"};
    if (std::filesystem::exists(tmp_out)) {
      std::filesystem::remove_all(tmp_out);
    }
    std::filesystem::create_directories(tmp_out);

    output_dir = std::string(std::filesystem::absolute(tmp_out).c_str());
  }

  std::filesystem::path tmp_path = std::filesystem::current_path() / "tmp";
  // make sure pre_processed_files as the first of the headers
  include_header_dirs.push_back(tmp_path.c_str());

  if (parse_result.count("include-header-dirs")) {
    auto include_system_dir =
        std::string(project_path + "/include/system_fake");
    include_header_dirs.push_back(include_system_dir);

    std::cout << "/include/system dir: " << include_system_dir << std::endl;

    include_header_dirs.push_back(
        "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/"
        "Developer/SDKs/MacOSX.sdk/usr/include");

    auto ihd = parse_result["include-header-dirs"].as<std::string>();
    const auto &ihdv = Split(ihd, ",");
    for (auto &h : ihdv) { include_header_dirs.push_back(h); }
  }

  if (parse_result.count("custom-headers")) {
    auto ihd = parse_result["custom-headers"].as<std::string>();
    const auto &ihdv = Split(ihd, ",");
    for (auto &h : ihdv) { custom_headers.push_back(h); }
  }

  if (parse_result.count("visit-headers")) {
    visit_headers = parse_result["visit-headers"].as<std::string>();
    const auto &headers = Split(visit_headers, ",");
    for (auto &h : headers) { visit_files.push_back(h); }
    // std::insert(headers.begin(), headers.end(), visit_files.begin());
  }

  if (parse_result.count("defines-macros")) {
    std::string defines_macros =
        parse_result["defines-macros"].as<std::string>();
    const auto &macros = Split(defines_macros, ",");
    for (auto &m : macros) {
      defines.insert(std::pair<std::string, std::string>(m, ""));
    }
  }

  if (parse_result.count("dump-json")) {
    is_dump_json = true;
  } else {
    std::cerr << "The dump-json flag is missing." << std::endl;
    return -1;
  }

  std::vector<std::string> pre_processed_files;
  PreProcessVisitFiles(tmp_path, visit_files, pre_processed_files,
                       is_dump_json);

  if (is_dump_json) {
    DumpJson(include_header_dirs, pre_processed_files, defines, output_dir);
    return 0;
  }

  return 0;
}
