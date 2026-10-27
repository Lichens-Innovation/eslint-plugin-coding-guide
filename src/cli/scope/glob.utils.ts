import { matchesGlob } from "node:path";

import { toPosixPath } from "../../utils/file.utils.js";

const NEGATION = "!";

export const matchesFileGlobs = (file: string, globs: string[]): boolean => {
  const path = toPosixPath(file);
  const included = globs.filter((glob) => !glob.startsWith(NEGATION));
  const excluded = globs.filter((glob) => glob.startsWith(NEGATION)).map((glob) => glob.slice(NEGATION.length));
  return included.some((glob) => matchesGlob(path, glob)) && !excluded.some((glob) => matchesGlob(path, glob));
};
