import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import dts from "unplugin-dts/vite";
import { defineConfig, type UserConfig } from "vite";

interface PackageJsonDependencies {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const readPackageJson = (): PackageJsonDependencies => {
  const content = readFileSync(resolve(import.meta.dirname, "package.json"), "utf8");
  try {
    return JSON.parse(content) as PackageJsonDependencies;
  } catch (error: unknown) {
    throw new Error("Failed to parse package.json", { cause: error });
  }
};

const packageJson = readPackageJson();
const externalPackageNames = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
];

const isExternalPackage = (id: string): boolean => {
  if (id.includes("?")) return false;
  return externalPackageNames.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
};

export default defineConfig((): UserConfig => ({
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.json",
      entryRoot: "src",
      insertTypesEntry: true,
      exclude: ["src/**/*.test.ts"],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    copyPublicDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    rolldownOptions: {
      external: isExternalPackage,
    },
  },
}));
