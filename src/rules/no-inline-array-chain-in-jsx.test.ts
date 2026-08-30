import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-array-chain-in-jsx.js";

ruleTester.run("no-inline-array-chain-in-jsx", rule, {
  valid: [
    { code: "const el = <div>{items.map((item) => item)}</div>;" },
    { code: "const el = <div>{precomputed}</div>;" },
  ],
  invalid: [
    {
      code: "const el = <div>{items.filter((item) => item.active).map((item) => item.name)}</div>;",
      errors: [{ messageId: "precompute", data: { count: 2 } }],
    },
  ],
});
