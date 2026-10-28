# Rules

All rules live under the `coding-guide/` namespace and are enabled by `configs.recommended`. Click a rule for its details, examples and options.

| Rule                                                                                  | Description                                                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`filename-convention-by-export-shape`](filename-convention-by-export-shape.md)       | Enforce filename conventions against a file's exported shape                                               |
| [`hoist-static-component-constants`](hoist-static-component-constants.md)             | Disallow a static array/object literal declared inside a component body                                    |
| [`max-files-per-folder`](max-files-per-folder.md)                                     | Enforce a maximum number of source files per folder                                                        |
| [`max-params-project`](max-params-project.md)                                         | Enforce a maximum number of parameters on project-owned functions                                          |
| [`no-bind-this`](no-bind-this.md)                                                     | Disallow `.bind(this)` — use an arrow function instead                                                     |
| [`no-double-negation`](no-double-negation.md)                                         | Disallow double negations such as `!isNotBlank(x)`, `!(a !== b)` or an `isNotDisabled` name                |
| [`no-explicit-undefined-optional`](no-explicit-undefined-optional.md)                 | Use `?` instead of an explicit `\| undefined` on params/properties that support it                         |
| [`no-exported-mutable-state`](no-exported-mutable-state.md)                           | Disallow exporting a mutable (let/var) module-scoped binding                                               |
| [`no-hook-returning-jsx`](no-hook-returning-jsx.md)                                   | Disallow a use* hook returning JSX                                                                         |
| [`no-inline-array-chain-in-jsx`](no-inline-array-chain-in-jsx.md)                     | Disallow chained array methods directly inside a JSX expression                                            |
| [`no-inline-await-access`](no-inline-await-access.md)                                 | Disallow operating directly on an awaited value, as in `(await promise).property`                          |
| [`no-inline-curried-handler`](no-inline-curried-handler.md)                           | Disallow a curried handler factory declared as a local component variable                                  |
| [`no-inline-guard-chain-handler`](no-inline-guard-chain-handler.md)                   | Disallow a JSX prop arrow whose body is a long `&&` guard chain                                            |
| [`no-inline-object-param-type`](no-inline-object-param-type.md)                       | Disallow inline object type literals on params, return types, variables, call type args and nested members |
| [`no-inline-render-function`](no-inline-render-function.md)                           | Disallow local render* helpers that return JSX, and using them from JSX                                    |
| [`no-jsx-in-variable`](no-jsx-in-variable.md)                                         | Disallow storing a JSX element/fragment in a variable                                                      |
| [`no-mobx-reaction`](no-mobx-reaction.md)                                             | Disallow MobX `reaction` — implicit side effects are hard to debug and trace                               |
| [`no-nested-try`](no-nested-try.md)                                                   | Disallow nesting a try statement inside another try block or catch handler                                 |
| [`no-non-hook-use-prefix`](no-non-hook-use-prefix.md)                                 | Disallow a use* named function whose body calls no hook                                                    |
| [`no-render-fn-in-usecallback`](no-render-fn-in-usecallback.md)                       | Disallow useCallback wrapping a JSX-returning or render*-named function                                    |
| [`no-tests-in-dunder-folder`](no-tests-in-dunder-folder.md)                           | Disallow test files inside a `__tests__` folder                                                            |
| [`no-trivial-usememo`](no-trivial-usememo.md)                                         | Disallow useMemo whose body has no function call (likely unnecessary memoization)                          |
| [`no-unguarded-json-parse`](no-unguarded-json-parse.md)                               | Require `JSON.parse(...)` to be wrapped in a try/catch                                                     |
| [`one-component-per-tsx-file`](one-component-per-tsx-file.md)                         | Allow at most one React component per `.tsx` file                                                          |
| [`prefer-antd-flex`](prefer-antd-flex.md)                                             | Prefer Ant Design `<Flex>` over a `<div className="flex …">` in Ant Design apps                            |
| [`prefer-blank-helpers`](prefer-blank-helpers.md)                                     | Prefer `isBlank`/`isNotBlank` over empty-string, falsy and `\|\|` checks on strings                        |
| [`prefer-each-table`](prefer-each-table.md)                                           | Prefer the tagged-template table form of `.each` over an array of tuples                                   |
| [`prefer-element-ref-type`](prefer-element-ref-type.md)                               | Prefer `useRef<ComponentRef<"tag">>(null)` over a raw `HTMLXxxElement` type argument                       |
| [`prefer-get-error-message`](prefer-get-error-message.md)                             | Prefer `getErrorMessage(error)` over a manual `error instanceof Error ? error.message : …` ternary         |
| [`prefer-includes-over-or-chain`](prefer-includes-over-or-chain.md)                   | Prefer `Array#includes` over a chain of `===` comparisons against the same value                           |
| [`prefer-jsx-short-circuit`](prefer-jsx-short-circuit.md)                             | Prefer `&&` short-circuit for optional JSX, with a boolean left side                                       |
| [`prefer-nullish-helpers`](prefer-nullish-helpers.md)                                 | Prefer `isNullish`/`!isNullish` over a manual null-and-undefined comparison pair                           |
| [`prefer-positive-condition`](prefer-positive-condition.md)                           | Prefer a positive condition in a ternary over a negated one with swapped branches                          |
| [`prefer-props-with-children`](prefer-props-with-children.md)                         | Prefer `PropsWithChildren<Props>` over a hand-declared `children` property                                 |
| [`prefer-reactnode-over-jsxelement-union`](prefer-reactnode-over-jsxelement-union.md) | Prefer `ReactNode` over a `JSX.Element \| null \| undefined` union                                         |
| [`prefer-role-query-over-testid`](prefer-role-query-over-testid.md)                   | Prefer Testing Library's `*ByRole` queries over `*ByTestId`                                                |
| [`prefer-some-over-find-check`](prefer-some-over-find-check.md)                       | Prefer `Array#some` over comparing `Array#find`'s result to undefined                                      |
| [`prefer-state-updater-form`](prefer-state-updater-form.md)                           | Prefer the updater-function form of a state setter when the new value depends on the current one           |
| [`require-aaa-comments`](require-aaa-comments.md)                                     | Require `// arrange`, `// act` and `// assert` comments in multi-statement tests                           |
| [`require-effect-cleanup`](require-effect-cleanup.md)                                 | Require a cleanup return from a `useEffect` that registers a timer/listener/subscription                   |
| [`require-fallback-on-deep-chain`](require-fallback-on-deep-chain.md)                 | Require a `??` fallback on a deep optional chain                                                           |
| [`require-numeric-enum-initializer`](require-numeric-enum-initializer.md)             | Require an explicit initializer on every enum member                                                       |
| [`require-usestate-useref-generic`](require-usestate-useref-generic.md)               | Require an explicit generic on `useState()`/`useRef()` when the initial value can't infer one              |
| [`todo-ticket-ref`](todo-ticket-ref.md)                                               | Require a ticket reference in the TODO comment                                                             |
