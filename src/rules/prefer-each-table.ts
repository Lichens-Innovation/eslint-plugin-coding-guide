import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const TEST_FUNCTIONS = new Set(["it", "test", "describe"]);
const PLACEHOLDER_RE = /%[sdifjop%]/g;
const UNSUPPORTED_PLACEHOLDER_RE = /%#/;

type Row = TSESTree.Expression[];

interface BuildTableArgs {
  sourceCode: Readonly<TSESLint.SourceCode>;
  names: string[];
  rows: Row[];
  indent: string;
}

interface BuildReplacementsArgs {
  sourceCode: Readonly<TSESLint.SourceCode>;
  node: TSESTree.CallExpression;
  rows: Row[];
}

interface Replacement {
  range: TSESTree.Range;
  text: string;
}

interface EachCallParts {
  title: TSESTree.StringLiteral;
  params: TSESTree.Parameter[];
}

interface RenameTitleArgs {
  title: string;
  names: string[];
}

const getRootIdentifierName = (node: TSESTree.Expression): string | null => {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") return getRootIdentifierName(node.object);
  return null;
};

const isEachCallee = (callee: TSESTree.Expression): callee is TSESTree.MemberExpression =>
  callee.type === "MemberExpression" &&
  !callee.computed &&
  callee.property.type === "Identifier" &&
  callee.property.name === "each" &&
  TEST_FUNCTIONS.has(getRootIdentifierName(callee.object) ?? "");

const isCell = (cell: TSESTree.ArrayExpression["elements"][number]): cell is TSESTree.Expression =>
  cell !== null && cell.type !== "SpreadElement";

const toRow = (element: TSESTree.ArrayExpression["elements"][number]): Row | null => {
  if (element?.type !== "ArrayExpression") return null;
  const cells = element.elements.filter(isCell);
  return cells.length === element.elements.length ? cells : null;
};

const renameTitle = ({ title, names }: RenameTitleArgs): string | null => {
  if (UNSUPPORTED_PLACEHOLDER_RE.test(title)) return null;

  let index = 0;
  const renamed = title.replace(PLACEHOLDER_RE, (placeholder) => {
    if (placeholder === "%%") return "%";
    const name = names[index];
    index += 1;
    return name ? `$${name}` : placeholder;
  });

  return index <= names.length ? renamed : null;
};

const buildTable = ({ sourceCode, names, rows, indent }: BuildTableArgs): string => {
  const cells = [names, ...rows.map((row) => row.map((cell) => `\${${sourceCode.getText(cell)}}`))];
  const widths = names.map((_, column) => Math.max(...cells.map((line) => line[column]?.length ?? 0)));
  const lines = cells.map((line) =>
    line.map((cell, column) => (column === line.length - 1 ? cell : cell.padEnd(widths[column] ?? 0))).join(" | ")
  );

  return ["`", ...lines.map((line) => `${indent}  ${line}`), `${indent}\``].join("\n");
};

const getEachCallParts = (node: TSESTree.CallExpression): EachCallParts | null => {
  const { parent } = node;
  if (parent.type !== "CallExpression" || parent.callee !== node) return null;

  const [title, callback] = parent.arguments;
  if (title?.type !== "Literal" || typeof title.value !== "string" || title.raw.includes("\\")) return null;
  if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression") return null;

  return { title, params: callback.params };
};

const getColumnNames = (params: TSESTree.Parameter[]): string[] | null => {
  const names = params.flatMap((param) => (param.type === "Identifier" && !param.typeAnnotation ? [param.name] : []));
  return names.length > 0 && names.length === params.length ? names : null;
};

const buildReplacements = ({ sourceCode, node, rows }: BuildReplacementsArgs): Replacement[] | null => {
  const parts = getEachCallParts(node);
  if (!parts) return null;

  const { title, params } = parts;
  const names = getColumnNames(params);
  const firstParam = params[0];
  const lastParam = params.at(-1);
  if (!names || !firstParam || !lastParam || rows.some((row) => row.length !== names.length)) return null;

  const newTitle = renameTitle({ title: title.value, names });
  if (newTitle === null) return null;

  const indent = /^\s*/.exec(sourceCode.lines[node.loc.start.line - 1] ?? "")?.[0] ?? "";
  const quote = title.raw[0] ?? '"';
  const table = buildTable({ sourceCode, names, rows, indent });

  return [
    { range: node.range, text: `${sourceCode.getText(node.callee)}${table}` },
    { range: title.range, text: `${quote}${newTitle}${quote}` },
    { range: [firstParam.range[0], lastParam.range[1]], text: `{ ${names.join(", ")} }` },
  ];
};

export default createRule({
  name: "prefer-each-table",
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Prefer the tagged-template table form of `.each` over an array of tuples",
    },
    schema: [],
    messages: {
      preferTable:
        "Prefer the tagged-template table form (`.each`` ... ``) over an array of tuples — named columns are more readable.",
    },
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      CallExpression(node) {
        if (!isEachCallee(node.callee)) return;

        const [table] = node.arguments;
        if (table?.type !== "ArrayExpression" || table.elements.length === 0) return;
        if (!table.elements.every((element) => element?.type === "ArrayExpression")) return;

        const rows = table.elements.map(toRow).filter((row) => row !== null);
        const replacements =
          rows.length === table.elements.length ? buildReplacements({ sourceCode, node, rows }) : null;

        context.report({
          node: table,
          messageId: "preferTable",
          ...(replacements && {
            fix: (fixer) => replacements.map(({ range, text }) => fixer.replaceTextRange(range, text)),
          }),
        });
      },
    };
  },
});
