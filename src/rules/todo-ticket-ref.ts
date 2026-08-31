import { createRule } from "../create-rule.js";

export interface Options {
  pattern?: string;
  terms?: string[];
  commentPattern?: string;
  description?: string;
  comment?: string;
}

type MessageIds = "missingTicket" | "missingTicketWithCommentPattern" | "missingTicketWithDescription";

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
    const commentPattern = options.commentPattern;
    const description = options.description;

    const sourceCode = context.sourceCode;
    const comments = sourceCode.getAllComments();

    // Ticket pattern: valid if it appears anywhere in the comment (e.g. "TODO: TBDT2-173", "TODO: https://.../browse/TBDT2-173")
    const ticketRegex = new RegExp(pattern, "i");
    const termSearchPatterns: Record<string, RegExp> = {};
    for (const term of terms) {
      termSearchPatterns[term] = commentPattern ? new RegExp(commentPattern, "i") : ticketRegex;
    }

    const getMessageId = (): MessageIds => {
      if (description) return "missingTicketWithDescription";
      if (commentPattern) return "missingTicketWithCommentPattern";
      return "missingTicket";
    };

    const checkComment = (comment: (typeof comments)[number]): void => {
      const value = comment.value;
      for (const term of terms) {
        if (!value.includes(term)) continue;
        const re = termSearchPatterns[term];
        if (re.test(value)) continue;
        context.report({
          loc: comment.loc,
          messageId: getMessageId(),
          data: { term, pattern, commentPattern: commentPattern ?? "", description: description ?? "" },
        });
      }
    };

    comments.forEach(checkComment);

    return {};
  },
});
