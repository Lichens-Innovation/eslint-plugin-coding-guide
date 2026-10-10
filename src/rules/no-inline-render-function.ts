import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isInlineFunction, type FunctionLike } from "../utils/ast.utils.js";
import { functionReturnsJsx } from "../utils/react.utils.js";

const RENDER_NAME_RE = /^render[A-Z]/;

type Context = Readonly<TSESLint.RuleContext<"extractSubcomponent", []>>;

interface RuleState {
  context: Context;
  // Variables already reported at their declaration site — avoid duplicate use-site reports.
  reportedVariables: WeakSet<object>;
}

interface ReportArgs {
  state: RuleState;
  node: TSESTree.Node;
  name: string;
  variable?: TSESLint.Scope.Variable;
}

interface ScopeLookupArgs {
  sourceCode: Readonly<TSESLint.SourceCode>;
  node: FunctionLike;
}

interface ResolveDeclarationVariableArgs extends ScopeLookupArgs {
  name: string;
}

interface ResolveVariableArgs {
  sourceCode: Readonly<TSESLint.SourceCode>;
  identifier: TSESTree.Identifier;
}

interface ReportLocalRenderInJsxArgs {
  state: RuleState;
  identifier: TSESTree.Identifier;
}

interface CheckRenderFunctionArgs {
  state: RuleState;
  node: FunctionLike;
  name?: string;
}

// Parameters are excluded: a render-prop passed in is not a local helper to extract.
const isLocallyDeclaredFunction = (variable?: TSESLint.Scope.Variable): boolean => {
  if (variable?.scope.type !== "function") return false;
  const def = variable.defs[0] as { type?: string } | undefined;
  return def?.type === "FunctionName" || def?.type === "Variable";
};

const isInsideJsx = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === "JSXExpressionContainer") return true;
    current = current.parent;
  }
  return false;
};

const isCallCallee = (node: TSESTree.Identifier): boolean =>
  node.parent.type === "CallExpression" && node.parent.callee === node;

const isBindingIdentifier = (node: TSESTree.Identifier): boolean =>
  (node.parent.type === "VariableDeclarator" || node.parent.type === "FunctionDeclaration") && node.parent.id === node;

const suggestedName = (name: string): string => {
  const suffix = name.slice("render".length);
  return isBlank(suffix) ? "Section" : suffix;
};

const resolveVariable = ({ sourceCode, identifier }: ResolveVariableArgs): TSESLint.Scope.Variable | undefined => {
  const scope = sourceCode.getScope(identifier);
  return scope.references.find((ref) => ref.identifier === identifier)?.resolved ?? undefined;
};

const report = ({ state, node, name, variable }: ReportArgs): void => {
  if (variable) {
    if (state.reportedVariables.has(variable)) return;
    state.reportedVariables.add(variable);
  }

  state.context.report({
    node,
    messageId: "extractSubcomponent",
    data: { name, suggested: suggestedName(name) },
  });
};

const reportLocalRenderInJsx = ({ state, identifier }: ReportLocalRenderInJsxArgs): void => {
  if (!RENDER_NAME_RE.test(identifier.name)) return;
  if (!isInsideJsx(identifier)) return;

  const variable = resolveVariable({ sourceCode: state.context.sourceCode, identifier });
  if (!isLocallyDeclaredFunction(variable)) return;

  report({ state, node: identifier, name: identifier.name, variable });
};

const isNestedInFunctionScope = ({ sourceCode, node }: ScopeLookupArgs): boolean => {
  // Arrow/FunctionExpression create their own function scope — check the binding's
  // enclosing scope (VariableDeclarator) instead of the function body scope.
  if (node.type === "FunctionDeclaration") {
    return sourceCode.getScope(node).upper?.type === "function";
  }
  if (node.parent.type === "VariableDeclarator") {
    return sourceCode.getScope(node.parent).type === "function";
  }
  return false;
};

const resolveDeclarationVariable = ({
  sourceCode,
  node,
  name,
}: ResolveDeclarationVariableArgs): TSESLint.Scope.Variable | undefined => {
  if (node.type === "FunctionDeclaration") {
    return sourceCode.getScope(node).upper?.set.get(name);
  }
  if (node.parent.type === "VariableDeclarator") {
    return sourceCode.getScope(node.parent).set.get(name);
  }
  return undefined;
};

const checkRenderFunction = ({ state, node, name }: CheckRenderFunctionArgs): void => {
  if (isBlank(name) || !RENDER_NAME_RE.test(name)) return;
  if (!functionReturnsJsx(node)) return;

  const sourceCode = state.context.sourceCode;
  if (!isNestedInFunctionScope({ sourceCode, node })) return;

  report({ state, node, name, variable: resolveDeclarationVariable({ sourceCode, node, name }) });
};

export default createRule({
  name: "no-inline-render-function",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow locally-declared render* helpers that return JSX, and using them from JSX (call or reference)",
    },
    schema: [],
    messages: {
      extractSubcomponent:
        "'{{name}}' is a local render helper called from JSX — extract a `<{{suggested}} />` subcomponent instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    const state: RuleState = { context, reportedVariables: new WeakSet<object>() };

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !isInlineFunction(node.init)) return;

        checkRenderFunction({ state, node: node.init, name: node.id.name });
      },

      FunctionDeclaration(node) {
        checkRenderFunction({ state, node, name: node.id?.name });
      },

      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        reportLocalRenderInJsx({ state, identifier: node.callee });
      },

      Identifier(node) {
        // Calls and declaration sites are handled by their own visitors.
        if (isCallCallee(node) || isBindingIdentifier(node)) return;

        reportLocalRenderInJsx({ state, identifier: node });
      },
    };
  },
});
