import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-jsx-short-circuit.js";

ruleTester.run("prefer-jsx-short-circuit", rule, {
  valid: [
    { code: `const el = <div>{isOpen && <Modal />}</div>;` },
    { code: `const el = <div>{!!count && <Badge count={count} />}</div>;` },
    { code: `const el = <div>{items.length > 0 && <List items={items} />}</div>;` },
    { code: `const el = <div>{!isMobile && "Clear"}</div>;` },
    { code: `const el = <div>{isOpen && label}</div>;` },
    { code: `const el = <div>{isOpen && \`\${count} items\`}</div>;` },
    { code: `const el = <div>{a > 0 && b > 0 && "text"}</div>;` },
  ],
  invalid: [
    {
      code: `const el = <div>{isOpen ? <Modal /> : null}</div>;`,
      output: `const el = <div>{isOpen && <Modal />}</div>;`,
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: `const el = <div>{items.length && <List items={items} />}</div>;`,
      output: `const el = <div>{items.length > 0 && <List items={items} />}</div>;`,
      errors: [{ messageId: "requireBooleanGuard" }],
    },
    {
      code: `const el = <div>{items.length && "text"}</div>;`,
      output: `const el = <div>{items.length > 0 && "text"}</div>;`,
      errors: [{ messageId: "requireBooleanGuard" }],
    },
  ],
});
