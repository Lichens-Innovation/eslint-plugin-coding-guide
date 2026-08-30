import { ruleTester } from "../rule-tester.js";
import rule from "./no-nested-try.js";

ruleTester.run("no-nested-try", rule, {
  valid: [
    { code: "try { doThing(); } catch (e) { logError(e); }" },
    { code: "function f() { try { a(); } catch { b(); } } function g() { try { c(); } catch { d(); } }" },
  ],
  invalid: [
    {
      code: "try { try { a(); } catch (e) { b(); } } catch (e2) { c(); }",
      errors: [{ messageId: "nestedTry" }],
    },
    {
      code: "try { a(); } catch (e) { try { b(); } catch (e2) { c(); } }",
      errors: [{ messageId: "nestedTry" }],
    },
  ],
});
