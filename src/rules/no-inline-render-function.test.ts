import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-render-function.js";

ruleTester.run("no-inline-render-function", rule, {
  valid: [
    { code: "function renderHeader() { return <div />; } renderHeader();" },
    { code: "function Widget({ renderHeader }) { return <div>{renderHeader()}</div>; }" },
  ],
  invalid: [
    {
      code: "function Widget() { function renderHeader() { return <div />; } return <div>{renderHeader()}</div>; }",
      errors: [{ messageId: "extractSubcomponent", data: { name: "renderHeader", suggested: "Header" } }],
    },
  ],
});
