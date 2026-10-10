import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { getImportedName } from "../utils/ast.utils.js";

const MOBX_MODULE = "mobx";
const REACTION_NAME = "reaction";

const isReactionSpecifier = (specifier: TSESTree.ImportClause): boolean =>
  specifier.type === "ImportSpecifier" && getImportedName(specifier) === REACTION_NAME;

const isNamespaceLikeSpecifier = (specifier: TSESTree.ImportClause): boolean =>
  specifier.type === "ImportNamespaceSpecifier" || specifier.type === "ImportDefaultSpecifier";

const getReactionMemberObjectName = (callee: TSESTree.Expression): string | undefined => {
  if (callee.type !== "MemberExpression" || callee.computed) return undefined;
  if (callee.property.type !== "Identifier" || callee.property.name !== REACTION_NAME) return undefined;
  return callee.object.type === "Identifier" ? callee.object.name : undefined;
};

interface IsReactionCalleeArgs {
  callee: TSESTree.Expression;
  reactionNames: Set<string>;
  namespaceNames: Set<string>;
}

const isReactionCallee = ({ callee, reactionNames, namespaceNames }: IsReactionCalleeArgs): boolean => {
  if (callee.type === "Identifier") {
    return reactionNames.has(callee.name);
  }

  const objectName = getReactionMemberObjectName(callee);
  return objectName !== undefined && namespaceNames.has(objectName);
};

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

    const registerSpecifier = (specifier: TSESTree.ImportClause): void => {
      if (isReactionSpecifier(specifier)) {
        reactionNames.add(specifier.local.name);
      } else if (isNamespaceLikeSpecifier(specifier)) {
        namespaceNames.add(specifier.local.name);
      }
    };

    return {
      ImportDeclaration(node) {
        if (node.source.value !== MOBX_MODULE) {
          return;
        }

        node.specifiers.forEach(registerSpecifier);
      },
      CallExpression(node) {
        if (isReactionCallee({ callee: node.callee, reactionNames, namespaceNames })) {
          context.report({ node, messageId: "noReaction" });
        }
      },
    };
  },
});
