import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

/** `isNot…` / `hasNo…` boolean names: a `!` in front of them reads as a double negation. */
const NEGATIVE_NAME_PATTERN = /^(is|are|was|were|has|have|can|could|should|will|does|did)(Not|No)(?=[A-Z])/;

/** `isNot<Word>…` where `<Word>` is itself negative, e.g. `isNotDisabled` → `isEnabled`. */
const NEGATED_WORD_NAME_PATTERN = /^(is|are|was|were|has|have|can|could|should|will|does|did)Not([A-Z][a-z]+)(.*)$/;

const DEFAULT_ANTONYMS: Record<string, string> = {
  Disabled: "Enabled",
  Disallowed: "Allowed",
  Disconnected: "Connected",
  Hidden: "Visible",
  Inactive: "Active",
  Incomplete: "Complete",
  Incorrect: "Correct",
  Invalid: "Valid",
  Invisible: "Visible",
  Unauthorized: "Authorized",
  Unavailable: "Available",
  Unchecked: "Checked",
  Undefined: "Defined",
  Unknown: "Known",
  Unselected: "Selected",
  Unverified: "Verified",
};

const INEQUALITY_TO_EQUALITY: Record<string, string> = { "!==": "===", "!=": "==" };

const isNegatedInequality = (node: TSESTree.Expression): node is TSESTree.BinaryExpression =>
  node.type === "BinaryExpression" && node.operator in INEQUALITY_TO_EQUALITY;

export interface Options {
  antonyms?: Record<string, string>;
}

type MessageId = "negatedNegativeName" | "negatedInequality" | "doubleNegativeName";

type Context = Readonly<TSESLint.RuleContext<MessageId, [Options]>>;

/** `foo`, `obj.foo`, `foo()`, `obj.foo()`, `obj?.foo()` → `"foo"` */
const getReferencedName = (node: TSESTree.Expression): string | undefined => {
  const inner = node.type === "ChainExpression" ? node.expression : node;
  const target = inner.type === "CallExpression" ? inner.callee : inner;
  if (target.type === "Identifier") return target.name;
  if (target.type === "MemberExpression" && !target.computed && target.property.type === "Identifier") {
    return target.property.name;
  }
  return undefined;
};

const toPositiveName = (name: string): string => name.replace(NEGATIVE_NAME_PATTERN, "$1");

const getDeclaredIdentifier = (node: TSESTree.Node): TSESTree.Identifier | undefined => {
  switch (node.type) {
    case "VariableDeclarator":
    case "FunctionDeclaration":
      return node.id?.type === "Identifier" ? node.id : undefined;
    case "PropertyDefinition":
    case "MethodDefinition":
    case "TSPropertySignature":
    case "TSMethodSignature":
      return !node.computed && node.key.type === "Identifier" ? node.key : undefined;
    default:
      return undefined;
  }
};

interface GetPositiveDeclaredNameArgs {
  name: string;
  antonyms: Record<string, string>;
}

const getPositiveDeclaredName = ({ name, antonyms }: GetPositiveDeclaredNameArgs): string | undefined => {
  const match = NEGATED_WORD_NAME_PATTERN.exec(name);
  if (!match) return undefined;
  const [, prefix, word, rest] = match;
  const antonym = antonyms[word];
  return antonym ? `${prefix}${antonym}${rest}` : undefined;
};

interface CheckNegationArgs {
  context: Context;
  node: TSESTree.UnaryExpression;
}

const reportNegatedNegativeName = ({ context, node }: CheckNegationArgs): void => {
  const name = getReferencedName(node.argument);
  if (isBlank(name) || !NEGATIVE_NAME_PATTERN.test(name)) return;

  context.report({ node, messageId: "negatedNegativeName", data: { name, positive: toPositiveName(name) } });
};

const checkNegation = ({ context, node }: CheckNegationArgs): void => {
  if (node.operator !== "!") return;

  const inequality = node.argument;
  if (isNegatedInequality(inequality)) {
    context.report({
      node,
      messageId: "negatedInequality",
      data: { operator: inequality.operator, equality: INEQUALITY_TO_EQUALITY[inequality.operator] },
    });
    return;
  }

  reportNegatedNegativeName({ context, node });
};

interface CheckDeclaredNameArgs {
  context: Context;
  node: TSESTree.Node;
  antonyms: Record<string, string>;
}

const checkDeclaredName = ({ context, node, antonyms }: CheckDeclaredNameArgs): void => {
  const identifier = getDeclaredIdentifier(node);
  if (!identifier) return;

  const positive = getPositiveDeclaredName({ name: identifier.name, antonyms });
  if (isBlank(positive)) return;

  context.report({
    node: identifier,
    messageId: "doubleNegativeName",
    data: { name: identifier.name, positive },
  });
};

export default createRule<[Options], MessageId>({
  name: "no-double-negation",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow double negations such as `!isNotBlank(x)`, `!(a !== b)` or an `isNotDisabled` name",
    },
    schema: [
      {
        type: "object",
        properties: {
          antonyms: { type: "object", additionalProperties: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      negatedNegativeName:
        "Double negation `!{{name}}` — use the positive form `{{positive}}` (or swap the branches) so the condition reads naturally.",
      negatedInequality: "Double negation `!(… {{operator}} …)` — use `{{equality}}` instead.",
      doubleNegativeName:
        "`{{name}}` is a double negation — name it positively (`{{positive}}`) and invert the logic where it is used.",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const antonyms = { ...DEFAULT_ANTONYMS, ...options.antonyms };

    return {
      UnaryExpression(node) {
        checkNegation({ context, node });
      },

      "VariableDeclarator, FunctionDeclaration, PropertyDefinition, MethodDefinition, TSPropertySignature, TSMethodSignature"(
        node: TSESTree.Node
      ) {
        checkDeclaredName({ context, node, antonyms });
      },
    };
  },
});
