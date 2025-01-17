import { ParseResult } from '@agoraio-extensions/terra-core';
import { CXXFile, CXXTYPE } from '../../src/cxx_terra_node';
import { ClangASTQualTypeParser } from '../../src/qualtype_parser';
import { genParseResultFromJson } from '../../src/cxx_parser';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('ClangASTQualTypeParser', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should parse parameter qual types in class methods', () => {
        let filePath = path.join(tmpDir, 'file.h');

        // 创建测试头文件，添加类型定义
        fs.writeFileSync(
            filePath,
            `
#pragma once
#include <stdint.h>

namespace agora {
namespace rtc {
    typedef uint32_t uid_t;
    typedef void* view_t;

    class IRtcEngine {
        void joinChannel(uid_t uid);
        void setConfig(int width, double height, view_t* view);
    };
}}
`
        );

        // 准备解析结果
        const cppastJSON = JSON.stringify([
            {
                "__TYPE": "CXXFile",
                "file_path": filePath,
                "nodes": [
                    {
                        "__TYPE": "Clazz",
                        "name": "IRtcEngine",
                        "namespaces": ["agora", "rtc"],
                        "methods": [
                            {
                                "__TYPE": "MemberFunction",
                                "name": "joinChannel",
                                "parameters": [
                                    {
                                        "__TYPE": "Variable",
                                        "name": "uid",
                                        "parent_full_scope_name": "agora::rtc::IRtcEngine::joinChannel",
                                        "type": {
                                            "__TYPE": "SimpleType",
                                            "is_builtin_type": false,
                                            "is_const": false,
                                            "kind": 101,
                                            "name": "uid",
                                            "source": "uid_t",
                                            "template_arguments": [],
                                            "clang_qualtype": ""
                                        }
                                    }
                                ],
                                "parent_name": "IRtcEngine",
                                "namespaces": ["agora", "rtc"]
                            },
                            {
                                "__TYPE": "MemberFunction",
                                "name": "setConfig",
                                "parameters": [
                                    {
                                        "__TYPE": "Variable",
                                        "name": "width",
                                        "parent_full_scope_name": "agora::rtc::IRtcEngine::setConfig",
                                        "type": {
                                            "__TYPE": "SimpleType",
                                            "is_builtin_type": true,
                                            "is_const": false,
                                            "kind": 100,
                                            "name": "int",
                                            "source": "int",
                                            "template_arguments": [],
                                            "clang_qualtype": ""
                                        }
                                    },
                                    {
                                        "__TYPE": "Variable",
                                        "name": "height",
                                        "parent_full_scope_name": "agora::rtc::IRtcEngine::setConfig",
                                        "type": {
                                            "__TYPE": "SimpleType",
                                            "is_builtin_type": true,
                                            "is_const": false,
                                            "kind": 100,
                                            "name": "double",
                                            "source": "double",
                                            "template_arguments": [],
                                            "clang_qualtype": ""
                                        }
                                    },
                                    {
                                        "__TYPE": "Variable",
                                        "name": "view",
                                        "parent_full_scope_name": "agora::rtc::IRtcEngine::setConfig",
                                        "type": {
                                            "__TYPE": "SimpleType",
                                            "is_builtin_type": false,
                                            "is_const": false,
                                            "kind": 101,
                                            "name": "view",
                                            "source": "view_t*",
                                            "template_arguments": [],
                                            "clang_qualtype": ""
                                        }
                                    }
                                ],
                                "parent_name": "IRtcEngine",
                                "namespaces": ["agora", "rtc"]
                            }
                        ]
                    }
                ]
            }
        ]);

        let parseResult = genParseResultFromJson(cppastJSON);

        // 执行解析
        ClangASTQualTypeParser(tmpDir, [], [filePath], parseResult);

        // 验证结果
        const cxxFile = parseResult.nodes[0] as CXXFile;
        const clazz = cxxFile.nodes[0];
        const methods = clazz.asClazz().methods;

        // 验证第一个方法的参数
        expect(methods[0].parameters[0].type.clang_qualtype).toBe('uid_t');

        // 验证第二个方法的参数
        expect(methods[1].parameters[0].type.clang_qualtype).toBe('int');
        expect(methods[1].parameters[1].type.clang_qualtype).toBe('double');
        expect(methods[1].parameters[2].type.clang_qualtype).toBe('view_t *');
    });
});