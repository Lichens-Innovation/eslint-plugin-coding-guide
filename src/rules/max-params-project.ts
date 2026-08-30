import { ESLintUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils";
import type * as ts from "typescript";

import { createRule } from "../create-rule.js";

const WRAPPER_TYPES = new Set<string>([
  "Property",
  "ObjectExpression",
  "ArrayExpression",
  "SpreadElement",
  "ChainExpression",
  "ConditionalExpression",
  "LogicalExpression",
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
]);

type FunctionLike = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

const EXPLANATION = `
{{name}} has {{count}} parameters. Maximum allowed is {{max}}.
The idea is to group related parameters together into a single object making callsites more readable because the caller needs to explicitly name each parameter.
The house style is a named Args interface: capitalize the function name, add an Args suffix, and take a single destructured object of that type. Do not leave the shape inline and anonymous.
Example:
  interface BuildSiteEquipmentKeyArgs {
    siteSlug?: string;
    equipmentSlug?: string;
  }

  const buildSiteEquipmentSlugKey = ({ siteSlug, equipmentSlug }: BuildSiteEquipmentKeyArgs) => {
    // ...
  }
`;

export interface Options {
  max?: number;
}

const getFunctionName = (node: FunctionLike): string => {
  const parent = node.parent;
  if (node.type === "ArrowFunctionExpression") return "Arrow function";
  if (parent?.type === "MethodDefinition" || (parent?.type === "Property" && parent.method)) {
    const key = parent.key;
    if (key.type === "Identifier") return `Method '${key.name}'`;
    return "Method";
  }
  if (node.type === "FunctionDeclaration" && node.id?.name) return `Function '${node.id.name}'`;
  if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return `Function '${parent.id.name}'`;
  }
  return "Function";
};

const isJsxAttributeCallback = (node: FunctionLike): boolean => {
  const parent = node.parent;
  if (parent?.type !== "JSXExpressionContainer") return false;
  return parent.parent?.type === "JSXAttribute";
};

const isPassedAsCallArgument = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node = node;
  const seen = new Set<TSESTree.Node>();

  while (current.parent && !seen.has(current)) {
    seen.add(current);
    const parent = current.parent;

    if (parent.type === "CallExpression" || parent.type === "NewExpression") {
      return parent.arguments.includes(current as TSESTree.CallExpressionArgument);
    }

    if (WRAPPER_TYPES.has(parent.type)) {
      current = parent;
      continue;
    }

    break;
  }

  return false;
};

const isExternalFile = (fileName: string): boolean => {
  const normalized = fileName.replaceAll("\\", "/");
  return normalized.includes("/node_modules/") || normalized.includes("/typescript/lib/");
};

const typeDeclaredExternally = (type: ts.Type): boolean => {
  const seen = new Set<ts.Type>();

  const collectDeclarationFiles = (current: ts.Type): string[] => {
    if (seen.has(current)) return [];
    seen.add(current);

    if (current.isUnion() || current.isIntersection()) {
      return current.types.flatMap(collectDeclarationFiles);
    }

    const files: string[] = [];
    for (const signature of current.getCallSignatures()) {
      const declaration = signature.getDeclaration();
      if (declaration) files.push(declaration.getSourceFile().fileName);
    }

    const symbol = current.aliasSymbol ?? current.getSymbol();
    for (const declaration of symbol?.getDeclarations() ?? []) {
      files.push(declaration.getSourceFile().fileName);
    }

    return files;
  };

  return collectDeclarationFiles(type).some(isExternalFile);
};

interface BaseDeclaresMethodExternallyArgs {
  base: ts.Type;
  methodName: string;
  checker: ts.TypeChecker;
}

const baseDeclaresMethodExternally = ({ base, methodName, checker }: BaseDeclaresMethodExternallyArgs): boolean => {
  const property = checker.getPropertyOfType(base, methodName);
  const declarations = property?.getDeclarations() ?? [];
  return declarations.some((declaration) => isExternalFile(declaration.getSourceFile().fileName));
};

interface ClassMethodOverridesExternalArgs {
  functionNode: FunctionLike;
  services: ReturnType<typeof ESLintUtils.getParserServices>;
  checker: ts.TypeChecker;
}

const classMethodOverridesExternal = ({
  functionNode,
  services,
  checker,
}: ClassMethodOverridesExternalArgs): boolean => {
  const methodDef = functionNode.parent;
  if (methodDef?.type !== "MethodDefinition") return false;

  const classLike = methodDef.parent.parent;
  if (classLike.type !== "ClassDeclaration" && classLike.type !== "ClassExpression") return false;

  const methodName = methodDef.key.type === "Identifier" ? methodDef.key.name : null;
  if (!methodName) return false;

  const tsClass = services.esTreeNodeToTSNodeMap.get(classLike);
  const classType = checker.getTypeAtLocation(tsClass);
  const bases = classType.getBaseTypes() ?? [];

  return bases.some((base) => baseDeclaresMethodExternally({ base, methodName, checker }));
};

interface IsContextuallyExternalArgs {
  node: FunctionLike;
  tsNode: ts.Node;
  checker: ts.TypeChecker;
}

const isContextuallyExternal = ({ node, tsNode, checker }: IsContextuallyExternalArgs): boolean => {
  if (node.type === "FunctionDeclaration") return false;
  const contextualType = checker.getContextualType(tsNode as ts.Expression);
  return !!contextualType && typeDeclaredExternally(contextualType);
};

export default createRule<[number | Options], "exceed">({
  name: "max-params-project",
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce a maximum number of parameters on project-owned functions",
    },
    schema: [
      {
        oneOf: [
          { type: "integer", minimum: 0 },
          {
            type: "object",
            properties: { max: { type: "integer", minimum: 0 } },
            additionalProperties: false,
          },
        ],
      },
    ],
    messages: {
      exceed: EXPLANATION,
    },
  },
  defaultOptions: [1],
  create(context, [option]) {
    const max = typeof option === "number" ? option : (option.max ?? 1);

    const findVariable = (identifierNode: TSESTree.Identifier): TSESLint.Scope.Variable | null => {
      let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(identifierNode);
      while (scope) {
        const variable = scope.variables.find((candidate) => candidate.name === identifierNode.name);
        if (variable) return variable;
        scope = scope.upper;
      }
      return null;
    };

    // Handles `const stateCreator = (set, get) => (...)` — a callback bound to a
    // name and passed by reference later (e.g. zustand's `create(stateCreator)` /
    // `persist(immer(stateCreator), opts)`) instead of inlined at the call site.
    const isImposedThroughVariableUsage = (node: FunctionLike): boolean => {
      const declarator = node.parent;
      if (declarator?.type !== "VariableDeclarator" || declarator.init !== node) return false;
      if (declarator.id.type !== "Identifier") return false;

      const variable = findVariable(declarator.id);
      if (!variable) return false;

      return variable.references.some(
        (reference) => reference.identifier !== declarator.id && isPassedAsCallArgument(reference.identifier)
      );
    };

    const isImposedByCallee = (node: FunctionLike): boolean => {
      if (isJsxAttributeCallback(node)) return true;
      if (isPassedAsCallArgument(node)) return true;
      return isImposedThroughVariableUsage(node);
    };

    const isImposedByExternalType = (node: FunctionLike): boolean => {
      try {
        const services = ESLintUtils.getParserServices(context, true);
        if (!services.program) return false;

        const checker = services.program.getTypeChecker();
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        if (!tsNode) return false;

        if (isContextuallyExternal({ node, tsNode, checker })) return true;

        return classMethodOverridesExternal({ functionNode: node, services, checker });
      } catch {
        return false;
      }
    };

    const checkFunction = (node: FunctionLike): void => {
      if (node.params.length <= max) return;
      if (isImposedByCallee(node)) return;
      if (isImposedByExternalType(node)) return;

      context.report({
        node,
        messageId: "exceed",
        data: {
          name: getFunctionName(node),
          count: node.params.length,
          max,
        },
      });
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
