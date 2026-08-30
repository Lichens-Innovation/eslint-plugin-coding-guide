import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-guard-chain-handler.js";

ruleTester.run("no-inline-guard-chain-handler", rule, {
  valid: [
    { code: "const el = <Button onPress={() => doIt()} />;" },
    { code: "const el = <Button onPress={() => !a && doIt()} />;" },
  ],
  invalid: [
    {
      code: "const el = <Button onPress={() => !a && !b && !c && doIt()} />;",
      errors: [{ messageId: "extractHandler", data: { count: 4 } }],
    },
  ],
});
