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
    {
      code: "export const Widget = observer(() => <div />);",
      filename: "widget.tsx",
    },
    {
      code: "export default observer(() => <div />);",
      filename: "widget.tsx",
    },
    {
      code: "export const WidgetContext = createContext(null);\nexport const Widget = memo(() => <div />);",
      filename: "widget.tsx",
    },
    {
      code: "export const Widget = observer(() => <div />);\nexport const useWidget = observer(() => <div />);",
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
    {
      code: "const WidgetContent = observer(() => <div />);\nexport const Widget = observer(() => <WidgetContent />);",
      filename: "widget.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "WidgetContent", name: "Widget" } }],
    },
    {
      code: "export const Widget = () => <div />;\nconst Header = React.memo(function Header() { return <header />; });",
      filename: "widgets.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "Header" } }],
    },
    {
      code: "export const Widget = () => <div />;\nconst Input = memo(forwardRef((props, ref) => <input ref={ref} />));",
      filename: "widgets.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "Input" } }],
    },
    {
      code: "export const Widget = () => <div />;\nexport default observer(() => <header />);",
      filename: "widgets.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "default export" } }],
    },
    {
      code: "export const Widget = () => <div />;\nexport default () => <header />;",
      filename: "widgets.tsx",
      errors: [{ messageId: "extraComponent", data: { existing: "Widget", name: "default export" } }],
    },
  ],
});
