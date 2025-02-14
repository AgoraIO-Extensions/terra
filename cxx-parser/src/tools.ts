import * as fs from 'fs';

export function replaceText(
  filePath: string,
  original_text: string,
  replaced_text: string,
  shouldSkip?: (line: string) => boolean
): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip files that don't contain original text
    if (!content.includes(original_text)) {
      return false;
    }

    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip lines that match the shouldSkip condition (if provided)
      if (shouldSkip && shouldSkip(line)) {
        continue;
      }
      // Replace original_text with replaced_text in other lines
      if (line.includes(original_text)) {
        lines[i] = line.replace(new RegExp(original_text, 'g'), replaced_text);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}
