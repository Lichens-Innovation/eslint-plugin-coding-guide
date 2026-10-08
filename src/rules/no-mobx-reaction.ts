import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const MOBX_MODULE = "mobx";
const REACTION_NAME = "reaction";

const getImportedName = (specifier: TSESTree.ImportSpecifier): string =>
  specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;

export default createRule({
  name: "no-mobx-reaction",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow MobX `reaction` — implicit side effects are hard to debug and trace",
    },
    schema: [],
    messages: {
      noReaction:
        "Avoid MobX `reaction` — implicit side effects make the data flow hard to debug and trace. Derive values with `computed` or trigger the side effect explicitly from the action that changes the state.",
    },
  },
  defaultOptions: [],
  create(context) {
    const reactionNames = new Set<string>();
    const namespaceNames = new Set<string>();

    const isReactionCallee = (callee: TSESTree.Expression): boolean => {
      if (callee.type === "Identifier") {
        return reactionNames.has(callee.name);
      }

      return (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        namespaceNames.has(callee.object.name) &&
        callee.property.type === "Identifier" &&
        callee.property.name === REACTION_NAME
      );
    };

    return {
      ImportDeclaration(node) {
        if (node.source.value !== MOBX_MODULE) {
          return;
        }

        node.specifiers.forEach((specifier) => {
          if (specifier.type === "ImportSpecifier" && getImportedName(specifier) === REACTION_NAME) {
            reactionNames.add(specifier.local.name);
          } else if (specifier.type === "ImportNamespaceSpecifier" || specifier.type === "ImportDefaultSpecifier") {
            namespaceNames.add(specifier.local.name);
          }
        });
      },
      CallExpression(node) {
        if (isReactionCallee(node.callee)) {
          context.report({ node, messageId: "noReaction" });
        }
      },
    };
  },
});
