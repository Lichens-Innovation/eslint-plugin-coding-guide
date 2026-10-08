import { ruleTester } from "../rule-tester.js";
import rule from "./no-double-negation.js";

ruleTester.run("no-double-negation", rule, {
  valid: [
    { code: `if (isBlank(value)) doSomething();` },
    { code: `if (isNotBlank(value)) doSomething();` },
    { code: `if (!isBlank(value)) doSomething();` },
    { code: `if (!hasNotes) doSomething();` },
    { code: `if (!isNothing) doSomething();` },
    { code: `const isEnabled = !isDisabled;` },
    { code: `const isNotEmpty = items.length > 0;` },
    { code: `const isNotDisplayed = false;` },
    { code: `const hasValue = !!value;` },
    { code: `if (!(a === b)) doSomething();` },
    { code: `const options = { isNotDisabled: true };` },
  ],
  invalid: [
    {
      code: `if (!isNotBlank(value)) doSomething();`,
      errors: [{ messageId: "negatedNegativeName", data: { name: "isNotBlank", positive: "isBlank" } }],
    },
    {
      code: `if (!user.hasNoPermissions) deny();`,
      errors: [{ messageId: "negatedNegativeName", data: { name: "hasNoPermissions", positive: "hasPermissions" } }],
    },
    {
      code: `const ok = !store?.isNotReady();`,
      errors: [{ messageId: "negatedNegativeName", data: { name: "isNotReady", positive: "isReady" } }],
    },
    {
      code: `if (!(a !== b)) doSomething();`,
      errors: [{ messageId: "negatedInequality", data: { operator: "!==", equality: "===" } }],
    },
    {
      code: `const isNotDisabled = !props.disabled;`,
      errors: [{ messageId: "doubleNegativeName", data: { name: "isNotDisabled", positive: "isEnabled" } }],
    },
    {
      code: `function isNotInvalidEmail(email: string) { return check(email); }`,
      errors: [{ messageId: "doubleNegativeName", data: { name: "isNotInvalidEmail", positive: "isValidEmail" } }],
    },
    {
      code: `interface Props { isNotHidden?: boolean; }`,
      errors: [{ messageId: "doubleNegativeName", data: { name: "isNotHidden", positive: "isVisible" } }],
    },
    {
      code: `const isNotArchived = true;`,
      options: [{ antonyms: { Archived: "Active" } }],
      errors: [{ messageId: "doubleNegativeName", data: { name: "isNotArchived", positive: "isActive" } }],
    },
  ],
});
