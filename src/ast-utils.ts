import type { TSESTree } from "@typescript-eslint/utils";

const isNode = (value: unknown): value is TSESTree.Node =>
  typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";

export const getChildNodes = (node: TSESTree.Node): TSESTree.Node[] =>
  Object.entries(node)
    .filter(([key]) => key !== "parent")
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter(isNode);

type FunctionLike = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration;

/** True when the function body is (or returns) a JSX element/fragment at the top level. */
export const functionReturnsJsx = (fn?: FunctionLike | null): boolean => {
  if (!fn) return false;
  if (["JSXElement", "JSXFragment"].includes(fn.body.type)) return true;
  if (fn.body.type !== "BlockStatement") return false;

  return fn.body.body.some(
    (statement) =>
      statement.type === "ReturnStatement" &&
      statement.argument !== null &&
      ["JSXElement", "JSXFragment"].includes(statement.argument.type)
  );
};
