import { parse } from "npm:@plussub/srt-vtt-parser";
import { readFileSync, createWritableStream } from "node:fs";

/**
 * Extract text from subtitles file at `path`.
 * Paragraphs (detected as long pauses) are split in the output.
 */
function* processFile(path: string) {
  const str = readFileSync(path, { encoding: "utf-8" });
  let prevEnd = 0;
  for (const { from: start, to: end, text } of parse(str)) {
    if (start - prevEnd > 1000) {
      yield "\n";
    }
    yield text;
    yield "\n";
    prevEnd = end;
  }
}

// TODO: command line, output, run on folder
