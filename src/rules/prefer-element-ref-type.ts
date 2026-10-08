import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { hasNamedImport, isIdentifierCall } from "../utils/ast.utils.js";

// `HTMLHeadingElement` is shared by h1–h6 and `HTMLTableCellElement` by td/th, so they are left
// unmapped: the report asks for the tag instead of guessing one.
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
  HTMLLabelElement: "label",
};

interface HtmlElementTypeArg {
  typeArg: TSESTree.TSTypeReference;
  typeName: string;
}

const getHtmlElementTypeArg = (node: TSESTree.CallExpression): HtmlElementTypeArg | null => {
  const typeArg = node.typeArguments?.params[0];
  if (!typeArg || typeArg.type !== "TSTypeReference" || typeArg.typeName.type !== "Identifier") return null;

  const typeName = typeArg.typeName.name;
  if (!/^HTML\w*Element$/.test(typeName)) return null;

  return { typeArg, typeName };
};

export default createRule({
  name: "prefer-element-ref-type",
  meta: {
    type: "suggestion",
    docs: {
      description: 'Prefer useRef<ComponentRef<"tag">>(null) over a raw HTMLXxxElement type argument',
    },
    fixable: "code",
    schema: [],
    messages: {
      preferElementRef: 'Use `ComponentRef<"{{tag}}">` (from "react") instead of `{{typeName}}` for this ref.',
      preferElementRefUnknownTag:
        'Use `ComponentRef<"tag">` (from "react") with the JSX tag this ref is attached to, instead of `{{typeName}}`.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isIdentifierCall({ node, name: "useRef" })) return;

        const htmlElementTypeArg = getHtmlElementTypeArg(node);
        if (!htmlElementTypeArg) return;

        const { typeArg, typeName } = htmlElementTypeArg;
        const tag = TAG_BY_HTML_ELEMENT[typeName];
        if (isBlank(tag)) {
          context.report({ node: typeArg, messageId: "preferElementRefUnknownTag", data: { typeName } });
          return;
        }

        const canAutofix = hasNamedImport({ program: context.sourceCode.ast, source: "react", name: "ComponentRef" });

        context.report({
          node: typeArg,
          messageId: "preferElementRef",
          data: { typeName, tag },
          fix: canAutofix ? (fixer) => fixer.replaceText(typeArg, `ComponentRef<"${tag}">`) : undefined,
        });
      },
    };
  },
});
