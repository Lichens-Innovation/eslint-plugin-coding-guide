import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-element-ref-type.js";

ruleTester.run("prefer-element-ref-type", rule, {
  valid: [{ code: `const ref = useRef<ElementRef<"div">>(null);` }, { code: `const ref = useRef<number>(0);` }],
  invalid: [
    {
      code: `const ref = useRef<HTMLDivElement>(null);`,
      errors: [{ messageId: "preferElementRef", data: { typeName: "HTMLDivElement", tag: "div" } }],
    },
    {
      code: `
        import { ElementRef } from "react";
        const ref = useRef<HTMLButtonElement>(null);
      `,
      output: `
        import { ElementRef } from "react";
        const ref = useRef<ElementRef<"button">>(null);
      `,
      errors: [{ messageId: "preferElementRef", data: { typeName: "HTMLButtonElement", tag: "button" } }],
    },
    {
      code: `const ref = useRef<HTMLWeirdElement>(null);`,
      errors: [{ messageId: "preferElementRef", data: { typeName: "HTMLWeirdElement", tag: "?" } }],
    },
  ],
});
