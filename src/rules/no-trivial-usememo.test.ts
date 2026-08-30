import { ruleTester } from "../rule-tester.js";
import rule from "./no-trivial-usememo.js";

ruleTester.run("no-trivial-usememo", rule, {
  valid: [
    { code: "const x = useMemo(() => computeExpensiveThing(a, b), [a, b]);" },
    { code: "const x = useMemo(() => { return computeExpensiveThing(a); }, [a]);" },
  ],
  invalid: [
    {
      code: "const x = useMemo(() => a + b, [a, b]);",
      errors: [{ messageId: "unnecessaryMemo" }],
    },
    {
      code: "const x = useMemo(() => { return a + b; }, [a, b]);",
      errors: [{ messageId: "unnecessaryMemo" }],
    },
  ],
});
