import { ruleTester } from "../rule-tester.js";
import rule from "./no-inline-render-function.js";

ruleTester.run("no-inline-render-function", rule, {
  valid: [
    { code: "function renderHeader() { return <div />; } renderHeader();" },
    { code: "function Widget({ renderHeader }) { return <div>{renderHeader()}</div>; }" },
    {
      code: "const renderHeader = () => <div />; function Widget() { return <div>{renderHeader()}</div>; }",
    },
  ],
  invalid: [
    {
      code: "function Widget() { function renderHeader() { return <div />; } return <div>{renderHeader()}</div>; }",
      errors: [{ messageId: "extractSubcomponent", data: { name: "renderHeader", suggested: "Header" } }],
    },
    {
      code: `function Home() {
  const renderToolCard = (tool: { path: string }) => <div key={tool.path} />;
  return <div>{[].map(renderToolCard)}</div>;
}`,
      errors: [{ messageId: "extractSubcomponent", data: { name: "renderToolCard", suggested: "ToolCard" } }],
    },
    {
      code: "function Widget() { function renderHeader() { return <div />; } return <div />; }",
      errors: [{ messageId: "extractSubcomponent", data: { name: "renderHeader", suggested: "Header" } }],
    },
    {
      code: "function Widget() { const renderFooter = () => { return <span />; }; return <div>{renderFooter()}</div>; }",
      errors: [{ messageId: "extractSubcomponent", data: { name: "renderFooter", suggested: "Footer" } }],
    },
  ],
});
