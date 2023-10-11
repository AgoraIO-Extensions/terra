#!/usr/bin/env bash
set -e
set -x

clang++ -fsyntax-only -Xclang -ast-dump=json -o /Users/fenglang/codes/aw/terra_shared_configs/aa.json -I /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include -I /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include/c++/v1/ /Users/fenglang/codes/aw/terra/aaa.h > ast.json