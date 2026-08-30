import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-curried-handler.js";

ruleTester.run("no-inline-curried-handler", rule, {
  valid: [
    { code: "const makeHandler = (id) => () => doThing(id);" }, // module scope, fine
    { code: "function Widget() { const onClick = () => doThing(); return null; }" },
  ],
  invalid: [
    {
      code: "function Widget() { const makeHandler = (id) => () => doThing(id); return null; }",
      errors: [{ messageId: "extractToUtils", data: { name: "makeHandler" } }],
    },
    {
      code: "function Widget() { const makeHandler = (id) => { return () => doThing(id); }; return null; }",
      errors: [{ messageId: "extractToUtils", data: { name: "makeHandler" } }],
    },
  ],
});
