import type { TSESTree } from "@typescript-eslint/utils";

export type FunctionLike =
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration;

export type InlineFunction = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

export type JsxNode = TSESTree.JSXElement | TSESTree.JSXFragment;

const INLINE_FUNCTION_TYPES = new Set(["FunctionExpression", "ArrowFunctionExpression"]);

const FUNCTION_TYPES = new Set([...INLINE_FUNCTION_TYPES, "FunctionDeclaration"]);

const JSX_NODE_TYPES = new Set(["JSXElement", "JSXFragment"]);

const TYPE_WRAPPER_TYPES = new Set([
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);

type TypeWrapper =
  TSESTree.TSAsExpression | TSESTree.TSNonNullExpression | TSESTree.TSSatisfiesExpression | TSESTree.TSTypeAssertion;

const isNode = (value: unknown): value is TSESTree.Node =>
  typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";

export const getChildNodes = (node: TSESTree.Node): TSESTree.Node[] =>
  Object.entries(node)
    .filter(([key]) => key !== "parent")
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter(isNode);

export const isFunctionNode = (node: TSESTree.Node): node is FunctionLike => FUNCTION_TYPES.has(node.type);

export const isInlineFunction = (node?: TSESTree.Node | null): node is InlineFunction =>
  !!node && INLINE_FUNCTION_TYPES.has(node.type);

export const isJsxNode = (node?: TSESTree.Node | null): node is JsxNode => !!node && JSX_NODE_TYPES.has(node.type);

export const isTypeWrapper = (node: TSESTree.Node): node is TypeWrapper => TYPE_WRAPPER_TYPES.has(node.type);

/** Strip type-only wrappers so `(x as T)`, `x!` and `x satisfies T` are seen as `x`. */
export const unwrapTypeExpression = (node: TSESTree.Node): TSESTree.Node => {
  let current = node;

  while (isTypeWrapper(current)) {
    current = current.expression;
  }

  return current;
};

export const isNegation = (node: TSESTree.Node): node is TSESTree.UnaryExpression =>
  node.type === "UnaryExpression" && node.operator === "!";

export const isUndefinedIdentifier = (node: TSESTree.Node): boolean =>
  node.type === "Identifier" && node.name === "undefined";

export const isNullLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === null;

export const isNullOrUndefined = (node: TSESTree.Node): boolean => isNullLiteral(node) || isUndefinedIdentifier(node);

interface FlattenLogicalChainArgs {
  node: TSESTree.Expression;
  operator: TSESTree.LogicalExpression["operator"];
}

/** `a && b && c` → `[a, b, c]`, whatever the parenthesization. */
export const flattenLogicalChain = ({ node, operator }: FlattenLogicalChainArgs): TSESTree.Expression[] => {
  if (node.type !== "LogicalExpression" || node.operator !== operator) return [node];

  return [
    ...flattenLogicalChain({ node: node.left, operator }),
    ...flattenLogicalChain({ node: node.right, operator }),
  ];
};

export const getDeclaratorName = (declarator: TSESTree.VariableDeclarator): string | undefined =>
  declarator.id.type === "Identifier" ? declarator.id.name : undefined;

interface IsIdentifierCallArgs {
  node: TSESTree.CallExpression;
  name: string;
}

export const isIdentifierCall = ({ node, name }: IsIdentifierCallArgs): boolean =>
  node.callee.type === "Identifier" && node.callee.name === name;

export const getImportedName = (specifier: TSESTree.ImportSpecifier): string =>
  specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;

interface HasNamedImportArgs {
  program: TSESTree.Program;
  source: string;
  name: string;
}

export const hasNamedImport = ({ program, source, name }: HasNamedImportArgs): boolean =>
  program.body.some(
    (statement) =>
      statement.type === "ImportDeclaration" &&
      statement.source.value === source &&
      statement.specifiers.some(
        (specifier) => specifier.type === "ImportSpecifier" && getImportedName(specifier) === name
      )
  );
