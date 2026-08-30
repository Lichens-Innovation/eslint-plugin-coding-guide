import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

const TAG_BY_HTML_ELEMENT: Record<string, string> = {
  HTMLDivElement: "div",
  HTMLSpanElement: "span",
  HTMLButtonElement: "button",
  HTMLInputElement: "input",
  HTMLTextAreaElement: "textarea",
  HTMLSelectElement: "select",
  HTMLFormElement: "form",
  HTMLAnchorElement: "a",
  HTMLUListElement: "ul",
  HTMLLIElement: "li",
  HTMLTableElement: "table",
  HTMLCanvasElement: "canvas",
  HTMLVideoElement: "video",
  HTMLAudioElement: "audio",
  HTMLImageElement: "img",
  HTMLParagraphElement: "p",
  HTMLHeadingElement: "h1",
  HTMLLabelElement: "label",
};

const hasElementRefImported = (program: TSESTree.Program): boolean =>
  program.body.some(
    (statement) =>
      statement.type === "ImportDeclaration" &&
      statement.source.value === "react" &&
      statement.specifiers.some(
        (specifier) =>
          specifier.type === "ImportSpecifier" &&
          specifier.imported.type === "Identifier" &&
          specifier.imported.name === "ElementRef"
      )
  );

export default createRule({
  name: "prefer-element-ref-type",
  meta: {
    type: "suggestion",
    docs: {
      description: 'Prefer useRef<ElementRef<"tag">>(null) over a raw HTMLXxxElement type argument',
    },
    fixable: "code",
    schema: [],
    messages: {
      preferElementRef: 'Use `ElementRef<"{{tag}}">` instead of `{{typeName}}` for this ref.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "useRef") return;

        const typeArg = node.typeArguments?.params[0];
        if (!typeArg || typeArg.type !== "TSTypeReference" || typeArg.typeName.type !== "Identifier") return;

        const typeName = typeArg.typeName.name;
        if (!/^HTML\w*Element$/.test(typeName)) return;

        const tag = TAG_BY_HTML_ELEMENT[typeName];
        if (!tag) {
          context.report({ node: typeArg, messageId: "preferElementRef", data: { typeName, tag: "?" } });
          return;
        }

        const canAutofix = hasElementRefImported(context.sourceCode.ast);

        context.report({
          node: typeArg,
          messageId: "preferElementRef",
          data: { typeName, tag },
          fix: canAutofix ? (fixer) => fixer.replaceText(typeArg, `ElementRef<"${tag}">`) : undefined,
        });
      },
    };
  },
});
