import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESTree } from "@typescript-eslint/utils";

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

export interface Options {
  antonyms?: Record<string, string>;
}

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

/** `isNotBlank` → `isBlank`, `hasNoItems` → `hasItems` */
const toPositiveName = (name: string): string => name.replace(NEGATIVE_NAME_PATTERN, "$1");

/** Identifier declaring a binding, function, class member or interface member. */
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

export default createRule<[Options], "negatedNegativeName" | "negatedInequality" | "doubleNegativeName">({
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

    const getPositiveDeclaredName = (name: string): string | undefined => {
      const match = NEGATED_WORD_NAME_PATTERN.exec(name);
      if (!match) return undefined;
      const [, prefix, word, rest] = match;
      const antonym = antonyms[word];
      return antonym ? `${prefix}${antonym}${rest}` : undefined;
    };

    return {
      UnaryExpression(node) {
        if (node.operator !== "!") return;
        const argument = node.argument;

        if (argument.type === "BinaryExpression" && INEQUALITY_TO_EQUALITY[argument.operator]) {
          context.report({
            node,
            messageId: "negatedInequality",
            data: { operator: argument.operator, equality: INEQUALITY_TO_EQUALITY[argument.operator] },
          });
          return;
        }

        const name = getReferencedName(argument);
        if (isBlank(name) || !NEGATIVE_NAME_PATTERN.test(name)) return;

        context.report({ node, messageId: "negatedNegativeName", data: { name, positive: toPositiveName(name) } });
      },

      "VariableDeclarator, FunctionDeclaration, PropertyDefinition, MethodDefinition, TSPropertySignature, TSMethodSignature"(
        node: TSESTree.Node
      ) {
        const identifier = getDeclaredIdentifier(node);
        if (!identifier) return;

        const positive = getPositiveDeclaredName(identifier.name);
        if (isBlank(positive)) return;

        context.report({
          node: identifier,
          messageId: "doubleNegativeName",
          data: { name: identifier.name, positive },
        });
      },
    };
  },
});
