import { ruleTester } from "../rule-tester.js";
import rule from "./require-effect-cleanup.js";

ruleTester.run("require-effect-cleanup", rule, {
  valid: [
    {
      code: `
        useEffect(() => {
          const id = setInterval(tick, 1000);
          return () => clearInterval(id);
        }, []);
      `,
    },
    {
      code: `
        useEffect(() => {
          console.log("mounted");
        }, []);
      `,
    },
  ],
  invalid: [
    {
      code: `
        useEffect(() => {
          setInterval(tick, 1000);
        }, []);
      `,
      errors: [{ messageId: "requireCleanup", data: { what: "interval/listener/subscription" } }],
    },
    {
      code: `
        useEffect(() => {
          window.addEventListener("resize", onResize);
        }, []);
      `,
      errors: [{ messageId: "requireCleanup", data: { what: "interval/listener/subscription" } }],
    },
  ],
});
