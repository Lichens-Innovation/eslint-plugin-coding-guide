export const toPosixPath = (path: string): string => path.replaceAll("\\", "/");

export const isTsxFile = (filename: string): boolean => filename.endsWith(".tsx");
