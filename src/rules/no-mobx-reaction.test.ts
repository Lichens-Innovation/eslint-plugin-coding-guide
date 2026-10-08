import { ruleTester } from "../rule-tester.js";
import rule from "./no-mobx-reaction.js";

ruleTester.run("no-mobx-reaction", rule, {
  valid: [
    { code: "import { computed } from 'mobx'; const total = computed(() => a + b);" },
    { code: "reaction(() => store.value, (value) => save(value));" },
    { code: "import { reaction } from 'other-lib'; reaction(() => 1, () => {});" },
    { code: "import * as mobx from 'mobx'; mobx.autorun(() => {});" },
    { code: "import { reaction } from 'mobx'; const ref = reaction;" },
  ],
  invalid: [
    {
      code: "import { reaction } from 'mobx'; reaction(() => store.value, (value) => save(value));",
      errors: [{ messageId: "noReaction" }],
    },
    {
      code: "import { reaction as react } from 'mobx'; const dispose = react(() => store.value, save);",
      errors: [{ messageId: "noReaction" }],
    },
    {
      code: "import * as mobx from 'mobx'; mobx.reaction(() => store.value, save);",
      errors: [{ messageId: "noReaction" }],
    },
    {
      code: "import { reaction } from 'mobx'; class Store { constructor() { this.dispose = reaction(() => this.id, () => this.load()); } }",
      errors: [{ messageId: "noReaction" }],
    },
  ],
});
