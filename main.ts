import { parse } from "@plussub/srt-vtt-parser";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
/**
 * Extract text from subtitles file at `path`.
 * Paragraphs (detected as pauses longer than `epsilon` in milliseconds) are
 * split in the output.
 */
function extractText(path: string, epsilon = 100) {
  const str = readFileSync(path, { encoding: "utf-8" });
  let prevEnd = 0;
  // Don't bother streaming output (with, say, a generator): we're already
  // reading the entire file into memory, streaming output just lowers memory
  // use from O(3n) to O(2n) (str, parsed array, output array).
  const out: string[] = [];
  for (const { from: start, to: end, text } of parse(str).entries) {
    if (start - prevEnd > epsilon) {
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
      force: { type: "boolean", short: "f" },
      epsilon: { type: "string" },
    },
  });
  if (parsedArgs.values.help) {
    console.log(`vtt-to-text-paragraphs [options] <in-file> ...

Extract text from input subtitle files. The extracted text is written to files
next to the original input files.

If an input file is a directory, do it on all .vtt files in the directory
instead.

Options:
  --epsilon <ms>:
    The number of milliseconds between subtitle lines to be treated as a new
    paragraph. Default: 100 milliseconds.
  --force, -f:
    By default, if the output file already exists then extraction is skipped.
    This flag forces extraction to be done regardless.
  --help, -h:
    Show help (this message)`);
    return;
  }
  if (parsedArgs.positionals.length === 0) {
    console.log("Please provide one or more input files");
    return;
  }
  const parsed = parseFloat(parsedArgs.values.epsilon ?? "");
  // We get NaN for invalid inputs; NaN > 0 is false so that leads us down the
  // correct branch
  const epsilon = parsed > 0 ? parsed : 100;
  let processedCount = 0;
  let skippedCount = 0;
  for (const inArg of parsedArgs.positionals) {
    const stat = statSync(inArg);
    const inFiles = stat.isDirectory()
      ? readdirSync(inArg)
          .filter((file) => file.endsWith(".vtt"))
          .map((file) => path.join(inArg, file))
      : [inArg];
    for (const inFile of inFiles) {
      let outFile = inFile.replace(/\.[^/.]+$/, ".txt");
      if (outFile === inFile) {
        outFile += ".txt";
      }
      // We check here to skip extractText if we can
      if (!parsedArgs.values.force && existsSync(outFile)) {
        skippedCount++;
        continue;
      }
      writeFileSync(outFile, extractText(inFile, epsilon));
      processedCount++;
    }
  }
  if (parsedArgs.values.force) {
    console.log(`Processed ${processedCount} files`);
  } else {
    console.log(
      `Processed ${processedCount} files, skipped ${skippedCount} already extracted files`,
    );
  }
}

main();
