import { isJsxNode, type FunctionLike } from "./ast.utils.js";

const HOOK_NAME_RE = /^use[A-Z]/;

export const isHookName = (name: string): boolean => HOOK_NAME_RE.test(name);

/** True when the function body is (or returns) a JSX element/fragment at the top level. */
export const functionReturnsJsx = (fn?: FunctionLike | null): boolean => {
  if (!fn) return false;
  if (isJsxNode(fn.body)) return true;
  if (fn.body.type !== "BlockStatement") return false;

  return fn.body.body.some((statement) => statement.type === "ReturnStatement" && isJsxNode(statement.argument));
};
