import { ruleTester } from "../rule-tester.js";
import rule from "./max-params-project.js";

ruleTester.run("max-params-project", rule, {
  valid: [
    // within the default max of 1
    { code: "function buildKey(args) { return args; }" },
    // callback whose arity is imposed by a callee (Array.map)
    { code: "[1, 2, 3].map((item, index) => item + index);" },
    // JSX prop callback
    {
      code: "const el = <Button onPress={(event, extra) => doThing(event, extra)} />;",
    },
  ],
  invalid: [
    {
      code: "function buildKey(siteSlug, equipmentSlug) { return `${siteSlug}-${equipmentSlug}`; }",
      errors: [{ messageId: "exceed", data: { name: "Function 'buildKey'", count: 2, max: 1 } }],
    },
    {
      code: "const buildKey = (siteSlug, equipmentSlug) => `${siteSlug}-${equipmentSlug}`;",
      errors: [{ messageId: "exceed", data: { name: "Arrow function", count: 2, max: 1 } }],
    },
    {
      code: "function buildKey(a, b, c) { return a + b + c; }",
      options: [{ max: 2 }],
      errors: [{ messageId: "exceed", data: { name: "Function 'buildKey'", count: 3, max: 2 } }],
    },
  ],
});
