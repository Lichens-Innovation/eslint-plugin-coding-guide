import { ruleTester } from "../rule-tester.js";
import rule from "./prefer-element-ref-type.js";

ruleTester.run("prefer-element-ref-type", rule, {
  valid: [{ code: `const ref = useRef<ComponentRef<"div">>(null);` }, { code: `const ref = useRef<number>(0);` }],
  invalid: [
    {
      code: `const ref = useRef<HTMLDivElement>(null);`,
      errors: [{ messageId: "preferElementRef", data: { typeName: "HTMLDivElement", tag: "div" } }],
    },
    {
      code: `
        import { ComponentRef } from "react";
        const ref = useRef<HTMLButtonElement>(null);
      `,
      output: `
        import { ComponentRef } from "react";
        const ref = useRef<ComponentRef<"button">>(null);
      `,
      errors: [{ messageId: "preferElementRef", data: { typeName: "HTMLButtonElement", tag: "button" } }],
    },
    {
      code: `const ref = useRef<HTMLWeirdElement>(null);`,
      errors: [{ messageId: "preferElementRefUnknownTag", data: { typeName: "HTMLWeirdElement" } }],
    },
    {
      code: `const ref = useRef<HTMLHeadingElement>(null);`,
      errors: [{ messageId: "preferElementRefUnknownTag", data: { typeName: "HTMLHeadingElement" } }],
    },
    {
      code: `
        import { ElementRef } from "react";
        const ref = useRef<HTMLDivElement>(null);
      `,
      output: null,
      errors: [{ messageId: "preferElementRef", data: { typeName: "HTMLDivElement", tag: "div" } }],
    },
  ],
});
