import { ruleTester } from "../rule-tester.js";
import rule from "./no-render-fn-in-usecallback.js";

ruleTester.run("no-render-fn-in-usecallback", rule, {
  valid: [
    { code: "const onClick = useCallback(() => doThing(), []);" },
    { code: "const onClick = useCallback(() => { doThing(); }, []);" },
  ],
  invalid: [
    {
      code: "const el = useCallback(() => <div />, []);",
      errors: [{ messageId: "extractSubcomponent" }],
    },
    {
      code: "const renderHeader = useCallback(() => doThing(), []);",
      errors: [{ messageId: "extractSubcomponent" }],
    },
  ],
});
