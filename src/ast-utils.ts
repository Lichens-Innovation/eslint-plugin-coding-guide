import type { TSESTree } from "@typescript-eslint/utils";

const isNode = (value: unknown): value is TSESTree.Node =>
  typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";

export const getChildNodes = (node: TSESTree.Node): TSESTree.Node[] =>
  Object.entries(node)
    .filter(([key]) => key !== "parent")
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter(isNode);
