import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { CXXParser } from '../../src/cxx_parser';
import { CXXFile, Struct } from '../../src/cxx_terra_node';
import { TerraContext } from '@agoraio-extensions/terra-core';


describe('conditional constructor initializers', () => {
  let directory: string;
  const actualExecSync = jest.requireActual('child_process').execSync;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-conditional-'));
    jest.spyOn(childProcess, 'execSync');
  });

  afterEach(() => {
    (childProcess.execSync as jest.Mock).mockRestore();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it.each([
    ['Windows', '#undef __APPLE__\n#define _WIN32 1', '16000'],
    ['macOS', '#define __APPLE__ 1\n#define TARGET_OS_IOS 0', '48000'],
    ['iOS', '#define __APPLE__ 1\n#define TARGET_OS_IOS 1', '16000'],
  ])('keeps the %s constructor default', (_, defines, expected) => {
    const source = path.join(directory, 'AgoraBase.h');
    fs.writeFileSync(source, `#pragma once
${defines}
namespace agora { namespace rtc {
struct ScreenAudioParameters {
  int sampleRate;
#if defined(__APPLE__) && !TARGET_OS_IOS
  bool excludeCurrentProcessAudio = true;
  ScreenAudioParameters(): sampleRate(48000) {}
#else
  ScreenAudioParameters(): sampleRate(16000) {}
#endif
}; }}
`);
    // cppast intentionally collects both platform branches. Its flattened input
    // must never be used to decide which constructor's initializer is active.
    const flattened = path.join(directory, 'flattened', 'AgoraBase.h');
    fs.mkdirSync(path.dirname(flattened));
    fs.writeFileSync(flattened, `#pragma once
namespace agora { namespace rtc {
struct ScreenAudioParameters {
  int sampleRate;
  bool excludeCurrentProcessAudio = true;
  ScreenAudioParameters(): sampleRate(48000) {}
  ScreenAudioParameters(): sampleRate(16000) {}
}; }}
`);
    const cppastResult = [{
      __TYPE: 'CXXFile', file_path: flattened, nodes: [{
        __TYPE: 'Struct', name: 'ScreenAudioParameters',
        namespaces: ['agora', 'rtc'], parent_name: '', source: '',
        attributes: [], base_clazzs: [], comment: '', methods: [],
        member_variables: [], constructors: [{
          __TYPE: 'Constructor', name: 'ScreenAudioParameters', parameters: [],
        }],
      }],
    }];
    (childProcess.execSync as jest.Mock).mockImplementation((command, options) => {
      if (String(command).startsWith('bash ')) {
        const output = String(command).match(/--output-dir=([^ ]+)/)![1];
        fs.writeFileSync(output, JSON.stringify(cppastResult));
        return '';
      }
      return actualExecSync(command, options);
    });
    const result = CXXParser({
      configDir: directory, buildDir: directory, clean: true,
    } as TerraContext, {
      includeHeaderDirs: [directory],
      parseFiles: { include: [source], exclude: [] },
    })!;
    const file = result.nodes[0] as CXXFile;
    const node = file.nodes[0] as Struct;
    expect(node.constructors[0].initializerList.find(
      (initializer) => initializer.name === 'sampleRate'
    )!.values).toEqual([expected]);
    expect(file.file_path).toEqual(flattened);
  });
});
