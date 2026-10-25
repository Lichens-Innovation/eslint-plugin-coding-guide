import { ruleTester } from "../rule-tester.js";
import rule from "./max-params-project.js";

ruleTester.run("max-params-project", rule, {
  valid: [
    // within the default max of 3
    { code: "function buildKey(siteSlug, areaSlug, equipmentSlug) { return siteSlug; }" },
    // callback whose arity is imposed by a callee (Array.map)
    { code: "[1, 2, 3].map((item, index, array) => item + index + array.length);" },
    // JSX prop callback
    {
      code: "const el = <Button onPress={(event, extra, more, last) => doThing(event, extra, more, last)} />;",
    },
  ],
  invalid: [
    {
      code: "function buildKey(siteSlug, areaSlug, equipmentSlug, sensorSlug) { return `${siteSlug}-${sensorSlug}`; }",
      errors: [{ messageId: "exceed", data: { name: "Function 'buildKey'", count: 4, max: 3 } }],
    },
    {
      code: "const buildKey = (siteSlug, areaSlug, equipmentSlug, sensorSlug) => `${siteSlug}-${sensorSlug}`;",
      errors: [{ messageId: "exceed", data: { name: "Arrow function", count: 4, max: 3 } }],
    },
    {
      code: "function buildKey(a, b, c) { return a + b + c; }",
      options: [{ max: 2 }],
      errors: [{ messageId: "exceed", data: { name: "Function 'buildKey'", count: 3, max: 2 } }],
    },
  ],
});
