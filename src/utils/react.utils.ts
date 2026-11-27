import type { TSESTree } from "@typescript-eslint/utils";

import { isInlineFunction, isJsxNode, type FunctionLike, type InlineFunction } from "./ast.utils.js";

const HOOK_NAME_RE = /^use[A-Z]/;

export const isHookName = (name: string): boolean => HOOK_NAME_RE.test(name);

export const functionReturnsJsx = (fn?: FunctionLike | null): boolean => {
  if (!fn) return false;
  if (isJsxNode(fn.body)) return true;
  if (fn.body.type !== "BlockStatement") return false;

  return fn.body.body.some((statement) => statement.type === "ReturnStatement" && isJsxNode(statement.argument));
};

// HOCs that take the component function as first argument: memo, forwardRef (react) and observer (mobx-react-lite). habit-hooks-disable non-essential-comment
const COMPONENT_WRAPPER_NAMES = new Set(["memo", "forwardRef", "observer"]);

const getCalleeName = (callee: TSESTree.Expression): string | undefined => {
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") return callee.property.name;
  return undefined;
};

const isComponentWrapperCall = (node: TSESTree.Node): node is TSESTree.CallExpression =>
  node.type === "CallExpression" && COMPONENT_WRAPPER_NAMES.has(getCalleeName(node.callee) ?? "");

export const unwrapComponentFunction = (node?: TSESTree.Node | null): InlineFunction | null => {
  if (!node) return null;
  if (isInlineFunction(node)) return node;
  if (!isComponentWrapperCall(node)) return null;

  const [firstArgument] = node.arguments;
  return firstArgument ? unwrapComponentFunction(firstArgument) : null;
};
