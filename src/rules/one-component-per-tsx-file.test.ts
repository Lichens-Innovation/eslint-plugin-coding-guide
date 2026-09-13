import { ruleTester } from "../rule-tester.js";
import rule from "./one-component-per-tsx-file.js";

ruleTester.run("one-component-per-tsx-file", rule, {
  valid: [
    {
      code: "export const Widget = () => <div />;",
      filename: "widget.tsx",
    },
    {
      code: "export const WIDGET = 1;\nexport const HEADER = 2;",
      filename: "widgets.ts",
    },
    {
      code: "export const useWidget = () => ({ ok: true });",
      filename: "use-widget.tsx",
    },
    {
      code: "export type WidgetProps = { label: string };",
      filename: "widget.tsx",
    },
    {
      code: "export const Widget = () => { const Inner = () => <span />; return <Inner />; };",
      filename: "widget.tsx",
    },
  ],
  invalid: [
    {
      code: "export const Widget = () => <div />;\nexport const Header = () => <header />;",
      filename: "widgets.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "Header" } }],
    },
    {
      code: "export const Widget = () => <WidgetHeader />;\nconst WidgetHeader = () => <header />;",
      filename: "widget.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "WidgetHeader" } }],
    },
    {
      code: "const Widget = () => <div />;\nexport default Widget;\nexport const Header = () => <header />;",
      filename: "widgets.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "Header" } }],
    },
  ],
});
