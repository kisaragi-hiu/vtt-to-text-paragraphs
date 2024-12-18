import { parse } from "npm:@plussub/srt-vtt-parser";
import { readFileSync } from "node:fs";

/**
 * Extract text from subtitles file at `path`.
 * Paragraphs (detected as long pauses) are split in the output.
 */
function processFile(path: string) {
  const str = readFileSync(path, { encoding: "utf-8" });
  let prevEnd = 0;
  parse(str).forEach(({ from: start, to: end, text }) => {
    if (start - prevEnd > 1000) {
      flush("\n");
    }
    flush(text);
    prevEnd = end;
  });
}
