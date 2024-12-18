import { parse } from "@plussub/srt-vtt-parser";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
/**
 * Extract text from subtitles file at `path`.
 * Paragraphs (detected as long pauses) are split in the output.
 */
function extractText(path: string) {
  const str = readFileSync(path, { encoding: "utf-8" });
  let prevEnd = 0;
  // Don't bother streaming output (with, say, a generator): we're already
  // reading the entire file into memory, streaming output just lowers memory
  // use from O(3n) to O(2n) (str, parsed array, output array).
  const out: string[] = [];
  for (const { from: start, to: end, text } of parse(str).entries) {
    if (start - prevEnd > 1000) {
      out.push("\n");
    }
    out.push(text);
    out.push("\n");
    prevEnd = end;
  }
  return out.join("");
}

function main() {
  const parsedArgs = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
    },
  });
  if (parsedArgs.values.help) {
    console.log(`vtt-to-text-paragraphs [options] <in-file> ...

Options:
  --help, -h: show help (this message)`);
    return;
  }
  if (parsedArgs.positionals.length === 0) {
    console.log("Please provide one or more input files");
  }
  for (const inFile of parsedArgs.positionals) {
    //
    let outFile = inFile.replace(/\.[^/.]+$/, ".txt");
    if (outFile === inFile) {
      outFile += ".txt";
    }
    writeFileSync(outFile, extractText(inFile));
  }
}

main();
