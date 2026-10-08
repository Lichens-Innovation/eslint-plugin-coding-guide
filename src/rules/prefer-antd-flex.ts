import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const ANTD_MODULE = "antd";
const FLEX_CLASS = "flex";
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies"] as const;

const usesAntdByDirectory = new Map<string, boolean>();

const isTsxFile = (filename: string): boolean => filename.replaceAll("\\", "/").endsWith(".tsx");

const readDeclaresAntd = (packageJsonPath: string): boolean => {
  try {
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>;
    return DEPENDENCY_FIELDS.some((field) => {
      const dependencies = manifest[field];
      return typeof dependencies === "object" && dependencies !== null && ANTD_MODULE in dependencies;
    });
  } catch {
    return false;
  }
};

/** True when the nearest package.json above `directory` declares `antd`. */
const isAntdProject = (directory: string): boolean => {
  const cached = usesAntdByDirectory.get(directory);
  if (cached !== undefined) return cached;

  const packageJsonPath = join(directory, "package.json");
  const parent = dirname(directory);
  let result = false;
  if (existsSync(packageJsonPath)) {
    result = readDeclaresAntd(packageJsonPath);
  } else if (parent !== directory) {
    result = isAntdProject(parent);
  }

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
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "div") return;

        const classNameAttribute = findClassNameAttribute(node);
        if (!classNameAttribute || !hasFlexClass(classNameAttribute)) return;
        if (!importsAntd && !isAntdProject(dirname(context.filename))) return;

        context.report({ node, messageId: "preferFlex" });
      },
    };
  },
});
