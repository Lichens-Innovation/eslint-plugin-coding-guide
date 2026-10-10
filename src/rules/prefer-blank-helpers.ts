import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isNegation } from "../utils/ast.utils.js";
import { createTypeResolver, isNullableStringType, type TypeResolver } from "../utils/type.utils.js";

const EQUALITY_OPERATORS = ["===", "=="];
const INEQUALITY_OPERATORS = ["!==", "!="];

type MessageId = "preferIsBlank" | "preferIsNotBlank" | "preferBlankFallback" | "preferBlankFallbackExtract";

const isEmptyStringLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === "";

const isZeroLiteral = (node: TSESTree.Node): boolean => node.type === "Literal" && node.value === 0;

/** Identifiers and property chains (`a.b?.c`), which can be repeated in `isBlank(x) ? fallback : x` without side effects. */
const isSimpleReference = (node: TSESTree.Node): boolean => {
  if (node.type === "ChainExpression") return isSimpleReference(node.expression);
  if (node.type === "Identifier" || node.type === "ThisExpression") return true;
  if (node.type !== "MemberExpression") return false;
  const isStaticProperty = !node.computed || node.property.type === "Literal";
  return isStaticProperty && isSimpleReference(node.object);
};

interface GetMemberObjectArgs {
  node: TSESTree.Node;
  propertyName: string;
}

const getMemberObject = ({ node, propertyName }: GetMemberObjectArgs): TSESTree.Expression | undefined => {
  if (node.type !== "MemberExpression" || node.computed) return undefined;
  if (node.property.type !== "Identifier" || node.property.name !== propertyName) return undefined;
  return node.object;
};

const getTrimSubject = (node: TSESTree.Node): TSESTree.Expression | undefined => {
  const inner = node.type === "ChainExpression" ? node.expression : node;
  if (inner.type !== "CallExpression" || inner.arguments.length > 0) return undefined;
  return getMemberObject({ node: inner.callee, propertyName: "trim" });
};

interface NegationParts {
  operand: TSESTree.Expression;
  isDoubleNegation: boolean;
}

const getNegationParts = (node: TSESTree.UnaryExpression): NegationParts => {
  if (isNegation(node.argument)) return { operand: node.argument.argument, isDoubleNegation: true };
  return { operand: node.argument, isDoubleNegation: false };
};

interface TypedNodeArgs {
  getTypeAtNode: TypeResolver;
  node: TSESTree.Node;
}

const isStringExpression = ({ getTypeAtNode, node }: TypedNodeArgs): boolean =>
  isNullableStringType(getTypeAtNode(node));

/** Without type information, assume the operand of `=== ""` is a string. */
const isMaybeStringExpression = ({ getTypeAtNode, node }: TypedNodeArgs): boolean => {
  const type = getTypeAtNode(node);
  return !type || isNullableStringType(type);
};

const getEmptyStringComparisonSubject = (args: TypedNodeArgs): TSESTree.Node | undefined => {
  const trimSubject = getTrimSubject(args.node);
  if (trimSubject) return trimSubject;
  return isMaybeStringExpression(args) ? args.node : undefined;
};

const getZeroLengthComparisonSubject = ({ getTypeAtNode, node }: TypedNodeArgs): TSESTree.Node | undefined => {
  const lengthObject = getMemberObject({ node, propertyName: "length" });
  if (!lengthObject) return undefined;
  const trimSubject = getTrimSubject(lengthObject);
  if (trimSubject) return trimSubject;
  return isStringExpression({ getTypeAtNode, node: lengthObject }) ? lengthObject : undefined;
};

interface BlankCheckSubjectArgs extends TypedNodeArgs {
  other: TSESTree.Node;
}

const getBlankCheckSubject = ({ other, ...args }: BlankCheckSubjectArgs): TSESTree.Node | undefined => {
  if (isEmptyStringLiteral(other)) return getEmptyStringComparisonSubject(args);
  if (isZeroLiteral(other)) return getZeroLengthComparisonSubject(args);
  return undefined;
};

const getFalsyCheckSubject = (args: TypedNodeArgs): TSESTree.Node | undefined => {
  const trimSubject = getTrimSubject(args.node);
  if (trimSubject) return trimSubject;
  return isStringExpression(args) ? args.node : undefined;
};

interface RuleState {
  context: Readonly<TSESLint.RuleContext<MessageId, []>>;
  getTypeAtNode: TypeResolver;
}

interface ReportArgs {
  state: RuleState;
  node: TSESTree.Node;
  messageId: MessageId;
  subject: TSESTree.Node;
}

const report = ({ state, node, messageId, subject }: ReportArgs): void => {
  state.context.report({ node, messageId, data: { expr: state.context.sourceCode.getText(subject) } });
};

interface CheckArgs<T extends TSESTree.Node> {
  state: RuleState;
  node: T;
}

const checkComparison = ({ state, node }: CheckArgs<TSESTree.BinaryExpression>): void => {
  const isEquality = EQUALITY_OPERATORS.includes(node.operator);
  if (!isEquality && !INEQUALITY_OPERATORS.includes(node.operator)) return;
  if (node.left.type === "PrivateIdentifier") return;

  const { getTypeAtNode } = state;
  const subject =
    getBlankCheckSubject({ getTypeAtNode, node: node.left, other: node.right }) ??
    getBlankCheckSubject({ getTypeAtNode, node: node.right, other: node.left });
  if (!subject) return;

  report({ state, node, messageId: isEquality ? "preferIsBlank" : "preferIsNotBlank", subject });
};

const checkNegation = ({ state, node }: CheckArgs<TSESTree.UnaryExpression>): void => {
  if (!isNegation(node) || isNegation(node.parent)) return;

  const { operand, isDoubleNegation } = getNegationParts(node);
  const subject = getFalsyCheckSubject({ getTypeAtNode: state.getTypeAtNode, node: operand });
  if (!subject) return;

  report({ state, node, messageId: isDoubleNegation ? "preferIsNotBlank" : "preferIsBlank", subject });
};

const checkFallback = ({ state, node }: CheckArgs<TSESTree.LogicalExpression>): void => {
  if (node.operator !== "||") return;

  const subject = getFalsyCheckSubject({ getTypeAtNode: state.getTypeAtNode, node: node.left });
  if (!subject) return;

  const messageId = isSimpleReference(subject) ? "preferBlankFallback" : "preferBlankFallbackExtract";
  report({ state, node, messageId, subject });
};

export default createRule({
  name: "prefer-blank-helpers",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer isBlank/isNotBlank over manual empty-string checks, falsy checks and `||` fallbacks on strings",
    },
    schema: [],
    messages: {
      preferIsBlank:
        "Manual empty-string check — use `isBlank({{expr}})` (handles null, undefined, empty and whitespace-only strings).",
      preferIsNotBlank:
        "Manual non-empty-string check — use `isNotBlank({{expr}})` (handles null, undefined, empty and whitespace-only strings).",
      preferBlankFallback:
        "`||` fallback on a string — use `isBlank({{expr}}) ? fallback : {{expr}}` to make the blank-string intent explicit.",
      preferBlankFallbackExtract:
        "`||` fallback on a string — store `{{expr}}` in a local variable, then use `isBlank(variable) ? fallback : variable` so it is not evaluated twice.",
    },
  },
  defaultOptions: [],
  create(context) {
    const state: RuleState = { context, getTypeAtNode: createTypeResolver(context.sourceCode) };

    return {
      BinaryExpression: (node) => checkComparison({ state, node }),
      UnaryExpression: (node) => checkNegation({ state, node }),
      LogicalExpression: (node) => checkFallback({ state, node }),
    };
  },
});
