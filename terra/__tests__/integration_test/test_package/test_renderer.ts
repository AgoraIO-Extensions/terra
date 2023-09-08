import { ParseResult, RenderResult } from '@agoraio-extensions/terra-core';

export default function (parseResult: ParseResult): RenderResult[] {
  let fileContent = JSON.stringify(parseResult.nodes);

  return [{ file_name: 'test_renderer.json', file_content: fileContent }];
}
