import { isBlank } from "@lichens-innovation/ts-common";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";

export interface Options {
  pattern?: string;
  terms?: string[];
  commentPattern?: string;
  description?: string;
  comment?: string;
}

type MessageIds = "missingTicket" | "missingTicketWithCommentPattern" | "missingTicketWithDescription";

const getMessageId = ({ description, commentPattern }: Options): MessageIds => {
  if (description) return "missingTicketWithDescription";
  if (!isBlank(commentPattern)) return "missingTicketWithCommentPattern";
  return "missingTicket";
};

export default createRule<[Options], MessageIds>({
  name: "todo-ticket-ref",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a ticket reference in the TODO comment",
    },
    schema: [
      {
        type: "object",
        properties: {
          pattern: { type: "string" },
          terms: { type: "array", items: { type: "string" } },
          commentPattern: { type: "string" },
          description: { type: "string" },
          comment: { type: "string" }, // ignored, kept for config compatibility (e.g. "TODO: JIRA-1234 - description")
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTicket: "{{ term }} comment doesn't reference a ticket number. Ticket pattern: {{ pattern }}",
      missingTicketWithCommentPattern:
        "{{ term }} comment doesn't reference a ticket number. Comment pattern: {{ commentPattern }}",
      missingTicketWithDescription: "{{ term }} comment doesn't reference a ticket number. {{ description }}",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const pattern = options.pattern ?? "([A-Z0-9]+-\\d+)";
    const terms = options.terms ?? ["TODO"];
    const { commentPattern, description } = options;

    // Unanchored on purpose: the reference may appear anywhere, e.g. "TODO: https://.../browse/TBDT2-173".
    const referenceRegex = new RegExp(isBlank(commentPattern) ? pattern : commentPattern, "i");
    const messageId = getMessageId(options);

    const findTermsMissingReference = (value: string): string[] =>
      referenceRegex.test(value) ? [] : terms.filter((term) => value.includes(term));

    const checkComment = (comment: TSESTree.Comment): void => {
      for (const term of findTermsMissingReference(comment.value)) {
        context.report({
          loc: comment.loc,
          messageId,
          data: { term, pattern, commentPattern: commentPattern ?? "", description: description ?? "" },
        });
      }
    };

    context.sourceCode.getAllComments().forEach(checkComment);

    return {};
  },
});
