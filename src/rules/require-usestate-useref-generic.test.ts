import { ruleTester } from "../rule-tester.js";
import rule from "./require-usestate-useref-generic.js";

ruleTester.run("require-usestate-useref-generic", rule, {
  valid: [
    { code: `const [count, setCount] = useState(0);` },
    { code: `const ref = useRef<HTMLDivElement>(null);` },
    { code: `const [user, setUser] = useState<User | null>(null);` },
  ],
  invalid: [
    {
      code: `const [user, setUser] = useState(null);`,
      errors: [{ messageId: "requireGeneric", data: { name: "useState" } }],
    },
    {
      code: `const ref = useRef();`,
      errors: [{ messageId: "requireGeneric", data: { name: "useRef" } }],
    },
    {
      code: `const ref = useRef(undefined);`,
      errors: [{ messageId: "requireGeneric", data: { name: "useRef" } }],
    },
  ],
});
