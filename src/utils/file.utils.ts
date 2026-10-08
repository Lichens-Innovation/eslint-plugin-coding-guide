export const toPosixPath = (path: string): string => path.replaceAll("\\", "/");

const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/;

export const isTestFile = (filename: string): boolean => TEST_FILE_PATTERN.test(filename);

export const isTsxFile = (filename: string): boolean => filename.endsWith(".tsx");
