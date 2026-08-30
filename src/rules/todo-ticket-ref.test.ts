import { ruleTester } from "../rule-tester.js";
import rule from "./todo-ticket-ref.js";

ruleTester.run("todo-ticket-ref", rule, {
  valid: [
    { code: `// TODO: JIRA-1234 fix this` },
    { code: `// TODO: https://example.atlassian.net/browse/JIRA-1234 fix this` },
    { code: `// just a regular comment` },
  ],
  invalid: [
    {
      code: `// TODO: fix this`,
      errors: [
        {
          messageId: "missingTicket",
          data: { term: "TODO", pattern: "([A-Z]+-\\d+)" },
        },
      ],
    },
  ],
});
