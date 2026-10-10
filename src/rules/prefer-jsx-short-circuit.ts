import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import {
  flattenLogicalChain,
  hasNamedImport,
  isJsxNode,
  isNegation,
  isNullLiteral,
  isTypeWrapper,
  isUndefinedIdentifier,
} from "../utils/ast.utils.js";
import { createTypeResolver, isBooleanishType, isNullableStringType, type TypeResolver } from "../utils/type.utils.js";

const TS_COMMON_SOURCE = "@lichens-innovation/ts-common";

const unwrap = (node: TSESTree.Expression): TSESTree.Expression => {
  let current = node;
  while (isTypeWrapper(current) || current.type === "ChainExpression") {
    current = current.expression;
  }
  return current;
};

const isJsxChildExpression = (node: TSESTree.Node): boolean => {
  const container = node.parent;
  if (!container || container.type !== "JSXExpressionContainer") return false;
  return isJsxNode(container.parent);
};

const isDiscardedNode = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  if (inner.type === "Literal" && inner.value === false) return true;
  return isNullLiteral(inner) || isUndefinedIdentifier(inner);
};

const isLengthAccess = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  return (
    inner.type === "MemberExpression" &&
    !inner.computed &&
    inner.property.type === "Identifier" &&
    inner.property.name === "length"
  );
};

const isSyntacticallyBoolean = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  if (isNegation(inner)) return true;
  if (inner.type === "BinaryExpression") return true;
  if (inner.type === "CallExpression") return true;
  if (inner.type === "Literal" && typeof inner.value === "boolean") return true;
  if (inner.type === "LogicalExpression" && inner.operator === "&&") {
    return isSyntacticallyBoolean(inner.left) && isSyntacticallyBoolean(inner.right);
  }
  return false;
};

const needsCoerceWithoutType = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  if (inner.type === "Identifier") return false;
  if (inner.type === "Literal" && typeof inner.value === "boolean") return false;
  return !isJsxNode(inner);
};

const isOptionalJsxTernary = (node: TSESTree.ConditionalExpression): boolean =>
  isJsxNode(node.consequent) && isDiscardedNode(node.alternate);

// The last `&&` operand is the rendered content (JSX, string, node...), not a guard —
// only the preceding operands can leak a falsy non-boolean value into the output.
const collectGuardLeaves = (node: TSESTree.Expression): TSESTree.Expression[] =>
  flattenLogicalChain({ node, operator: "&&" })
    .slice(0, -1)
    .filter((leaf) => !isJsxNode(leaf));

type MessageId = "preferShortCircuit" | "requireBooleanGuard" | "requireBlankGuard";

interface RuleState {
  context: Readonly<TSESLint.RuleContext<MessageId, []>>;
  sourceCode: Readonly<TSESLint.SourceCode>;
  getTypeAtNode: TypeResolver;
  hasIsNotBlankImport: boolean;
}

interface StateNodeArgs<T extends TSESTree.Node = TSESTree.Expression> {
  state: RuleState;
  node: T;
}

const getTextPreservingParens = ({ state: { sourceCode }, node }: StateNodeArgs<TSESTree.Node>): string => {
  const tokenBefore = sourceCode.getTokenBefore(node);
  const tokenAfter = sourceCode.getTokenAfter(node);
  if (tokenBefore?.value === "(" && tokenAfter?.value === ")") {
    return sourceCode.text.slice(tokenBefore.range[0], tokenAfter.range[1]);
  }
  return sourceCode.getText(node);
};

// A string guard must become `isNotBlank(x)`, not `!!x` (which `prefer-blank-helpers` rejects);
// without the import in scope there is no safe text to emit, so the report carries no fix.
const isStringGuard = ({ state, node }: StateNodeArgs): boolean =>
  !isLengthAccess(node) && isNullableStringType(state.getTypeAtNode(node));

const needsBooleanCoerce = ({ state, node }: StateNodeArgs): boolean => {
  if (isSyntacticallyBoolean(node)) return false;
  if (isLengthAccess(node)) return true;

  const type = state.getTypeAtNode(node);
  if (type) return !isBooleanishType(type);

  return needsCoerceWithoutType(node);
};

const coerceText = (args: StateNodeArgs): string | null => {
  const { state, node } = args;
  const text = state.sourceCode.getText(node);
  if (isLengthAccess(node)) return `${text} > 0`;
  if (isStringGuard(args)) return state.hasIsNotBlankImport ? `isNotBlank(${text})` : null;
  const inner = unwrap(node);
  if (["Identifier", "MemberExpression", "ChainExpression"].includes(inner.type)) {
    return `!!${text}`;
  }
  return `!!(${text})`;
};

const formatBooleanTest = (args: StateNodeArgs): string | null => {
  const { state, node } = args;
  if (node.type === "LogicalExpression" && node.operator === "&&") {
    const left = formatBooleanTest({ state, node: node.left });
    const right = formatBooleanTest({ state, node: node.right });
    return left === null || right === null ? null : `${left} && ${right}`;
  }
  if (needsBooleanCoerce(args)) return coerceText(args);
  return state.sourceCode.getText(node);
};

const checkTernary = ({ state, node }: StateNodeArgs<TSESTree.Node>): void => {
  if (node.type !== "ConditionalExpression") return;
  if (!isJsxChildExpression(node)) return;
  if (!isOptionalJsxTernary(node)) return;

  state.context.report({
    node,
    messageId: "preferShortCircuit",
    fix: (fixer) => {
      const testText = formatBooleanTest({ state, node: node.test });
      if (testText === null) return null;
      const consequentText = getTextPreservingParens({ state, node: node.consequent });
      return fixer.replaceText(node, `${testText} && ${consequentText}`);
    },
  });
};

const checkShortCircuit = ({ state, node }: StateNodeArgs<TSESTree.Node>): void => {
  if (node.type !== "LogicalExpression") return;
  if (!isJsxChildExpression(node)) return;

  for (const leaf of collectGuardLeaves(node)) {
    if (!needsBooleanCoerce({ state, node: leaf })) continue;

    const replacement = coerceText({ state, node: leaf });
    state.context.report({
      node: leaf,
      messageId: isStringGuard({ state, node: leaf }) ? "requireBlankGuard" : "requireBooleanGuard",
      data: { expr: state.sourceCode.getText(leaf) },
      fix: replacement === null ? null : (fixer) => fixer.replaceText(leaf, replacement),
    });
  }
};

export default createRule({
  name: "prefer-jsx-short-circuit",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer && short-circuit for optional JSX, with a boolean left side",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferShortCircuit: "Use `&&` short-circuit instead of `cond ? jsx : null` for optional rendering.",
      requireBooleanGuard:
        "Left side of `&&` in JSX may leak a non-boolean value — use a boolean comparison (`.length > 0`, `!isNullish(x)`) or `!!value`.",
      requireBlankGuard:
        'String on the left side of `&&` in JSX can render `""` — use `isNotBlank({{expr}})` from @lichens-innovation/ts-common.',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const state: RuleState = {
      context,
      sourceCode,
      getTypeAtNode: createTypeResolver(sourceCode),
      hasIsNotBlankImport: hasNamedImport({ program: sourceCode.ast, source: TS_COMMON_SOURCE, name: "isNotBlank" }),
    };

    return {
      "JSXExpressionContainer > ConditionalExpression"(node: TSESTree.Node) {
        checkTernary({ state, node });
      },

      "JSXExpressionContainer > LogicalExpression[operator='&&']"(node: TSESTree.Node) {
        checkShortCircuit({ state, node });
      },
    };
  },
});
