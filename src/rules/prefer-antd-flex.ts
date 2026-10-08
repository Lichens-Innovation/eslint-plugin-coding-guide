import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { isTsxFile } from "../utils/file.utils.js";

const ANTD_MODULE = "antd";
const FLEX_CLASS = "flex";
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies"] as const;

const usesAntdByDirectory = new Map<string, boolean>();

const declaresAntd = (manifest: Record<string, unknown>): boolean =>
  DEPENDENCY_FIELDS.some((field) => {
    const dependencies = manifest[field];
    return typeof dependencies === "object" && dependencies !== null && ANTD_MODULE in dependencies;
  });

const readDeclaresAntd = (packageJsonPath: string): boolean => {
  try {
    return declaresAntd(JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>);
  } catch {
    return false;
  }
};

const resolveIsAntdProject = (directory: string): boolean => {
  const packageJsonPath = join(directory, "package.json");
  if (existsSync(packageJsonPath)) return readDeclaresAntd(packageJsonPath);

  const parent = dirname(directory);
  return parent !== directory && isAntdProject(parent);
};

/** True when the nearest package.json above `directory` declares `antd`. */
const isAntdProject = (directory: string): boolean => {
  const cached = usesAntdByDirectory.get(directory);
  if (cached !== undefined) return cached;

  const result = resolveIsAntdProject(directory);
  usesAntdByDirectory.set(directory, result);

  return result;
};

/** Collects the static class strings of a className value: literals, template quasis and clsx/cn-style call args. */
const collectClassStrings = (node: TSESTree.Node): string[] => {
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? [node.value] : [];
    case "TemplateLiteral":
      return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw);
    case "JSXExpressionContainer":
      return node.expression.type === "JSXEmptyExpression" ? [] : collectClassStrings(node.expression);
    case "CallExpression":
      return node.arguments.flatMap(collectClassStrings);
    case "ArrayExpression":
      return node.elements.flatMap((element) => (element ? collectClassStrings(element) : []));
    case "LogicalExpression":
      return collectClassStrings(node.right);
    case "ConditionalExpression":
      return [...collectClassStrings(node.consequent), ...collectClassStrings(node.alternate)];
    default:
      return [];
  }
};

const hasFlexClass = (attribute: TSESTree.JSXAttribute): boolean =>
  attribute.value !== null &&
  collectClassStrings(attribute.value).some((classes) => classes.split(/\s+/).includes(FLEX_CLASS));

const isDivElement = (node: TSESTree.JSXOpeningElement): boolean =>
  node.name.type === "JSXIdentifier" && node.name.name === "div";

const findClassNameAttribute = (node: TSESTree.JSXOpeningElement): TSESTree.JSXAttribute | undefined =>
  node.attributes.find(
    (attribute): attribute is TSESTree.JSXAttribute =>
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === "className"
  );

export default createRule({
  name: "prefer-antd-flex",
  meta: {
    type: "suggestion",
    docs: {
      description: 'Prefer the Ant Design `<Flex>` component over a `<div className="flex …">` in Ant Design apps',
    },
    schema: [],
    messages: {
      preferFlex:
        'Use Ant Design `<Flex>` instead of `<div className="flex …">`. Map flex classes to props (`flex-col`→`vertical`, `gap-*`→`gap`, `items-*`→`align`, `justify-*`→`justify`, `flex-wrap`→`wrap`) and keep the other classes (padding, margins, sizing…) so the rendered layout stays identical.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (!isTsxFile(context.filename)) return {};

    let importsAntd = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value === ANTD_MODULE) {
          importsAntd = true;
        }
      },
      JSXOpeningElement(node) {
        if (!isDivElement(node)) return;

        const classNameAttribute = findClassNameAttribute(node);
        if (!classNameAttribute || !hasFlexClass(classNameAttribute)) return;
        if (!importsAntd && !isAntdProject(dirname(context.filename))) return;

        context.report({ node, messageId: "preferFlex" });
      },
    };
  },
});
