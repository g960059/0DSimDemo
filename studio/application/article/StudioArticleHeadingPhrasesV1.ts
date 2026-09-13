import { Parser, jaModel } from "budoux";

const japaneseHeadingParser = new Parser(jaModel);

/** Shared text segmentation for interactive and static readers; authored text stays intact. */
export function articleHeadingPhrasesV1(text: string, locale: string): readonly string[] {
  return locale.startsWith("ja") ? japaneseHeadingParser.parse(text) : [text];
}
