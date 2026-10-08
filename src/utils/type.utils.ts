import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import type { Type } from "typescript";

// Mirrors the ts.TypeFlags bit values we need — avoids a runtime dependency on
// the "typescript" package just for these constants (the `Type` values themselves
// come from the consumer's own type-aware parser services at lint time).
const TYPE_FLAG_UNDEFINED = 4;
const TYPE_FLAG_NULL = 8;
const TYPE_FLAG_VOID = 16;
const TYPE_FLAG_STRING = 32;
const TYPE_FLAG_STRING_LITERAL = 1024;
const TYPE_FLAG_TEMPLATE_LITERAL = 4194304;
const TYPE_FLAG_STRING_MAPPING = 8388608;
const STRING_FLAGS =
  TYPE_FLAG_STRING | TYPE_FLAG_STRING_LITERAL | TYPE_FLAG_TEMPLATE_LITERAL | TYPE_FLAG_STRING_MAPPING;
const TYPE_FLAG_BOOLEAN = 256;
const TYPE_FLAG_BOOLEAN_LITERAL = 8192;
const TYPE_FLAG_NEVER = 262144;
const NULLISH_FLAGS = TYPE_FLAG_UNDEFINED | TYPE_FLAG_NULL | TYPE_FLAG_VOID;
const BOOLEANISH_FLAGS = TYPE_FLAG_BOOLEAN | TYPE_FLAG_BOOLEAN_LITERAL | TYPE_FLAG_NEVER | NULLISH_FLAGS;

type TypeResolver = (node: TSESTree.Node) => Type | undefined;

/** Returns a resolver that yields the TS type of a node, or `undefined` when type information is unavailable. */
export const createTypeResolver =
  (sourceCode: Readonly<TSESLint.SourceCode>): TypeResolver =>
  (node) => {
    try {
      const services = sourceCode.parserServices;
      if (!services?.program || !services.esTreeNodeToTSNodeMap) return undefined;
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      if (!tsNode) return undefined;
      return services.program.getTypeChecker().getTypeAtLocation(tsNode);
    } catch {
      return undefined;
    }
  };

const isStringType = (type: Type): boolean => (type.flags & STRING_FLAGS) !== 0;

/** True for `string`, string literals, and their unions with null/undefined (at least one string member). */
export const isNullableStringType = (type?: Type): boolean => {
  if (!type) return false;
  if (isStringType(type)) return true;
  if (!type.isUnion()) return false;
  return (
    type.types.some(isStringType) &&
    type.types.every((member) => isStringType(member) || !!(member.flags & NULLISH_FLAGS))
  );
};

/** True for boolean, boolean literals, null/undefined/void/never and unions made only of those. */
export const isBooleanishType = (type?: Type): boolean => {
  if (!type) return false;
  if (type.flags & BOOLEANISH_FLAGS) return true;
  if (type.isUnion()) return type.types.every(isBooleanishType);
  return false;
};
