import { ruleTester } from "../rule-tester.js";
import rule from "./no-bind-this.js";

ruleTester.run("no-bind-this", rule, {
  valid: [
    { code: "const handler = () => this.handleClick();" },
    { code: "const bound = fn.bind(context);" },
    { code: "const bound = fn.bind(null, 1);" },
    { code: "obj['bind'](this);" },
    { code: "bind(this);" },
  ],
  invalid: [
    {
      code: "const handler = this.handleClick.bind(this);",
      errors: [{ messageId: "bindThis" }],
    },
    {
      code: "class A { constructor() { this.onClick = this.onClick.bind(this); } }",
      errors: [{ messageId: "bindThis" }],
    },
    {
      code: "el.addEventListener('click', this.onClick.bind(this, 42));",
      errors: [{ messageId: "bindThis" }],
    },
    {
      code: "const fn = function () { return this.x; }.bind(this);",
      errors: [{ messageId: "bindThis" }],
    },
    {
      code: "const handler = this.onClick?.bind(this);",
      errors: [{ messageId: "bindThis" }],
    },
  ],
});
