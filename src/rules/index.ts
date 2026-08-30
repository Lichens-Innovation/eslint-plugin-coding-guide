import filenameConventionByExportShape from "./filename-convention-by-export-shape.js";
import hoistStaticComponentConstants from "./hoist-static-component-constants.js";
import maxParamsProject from "./max-params-project.js";
import noExplicitUndefinedOptional from "./no-explicit-undefined-optional.js";
import noExportedMutableState from "./no-exported-mutable-state.js";
import noHookReturningJsx from "./no-hook-returning-jsx.js";
import noInlineArrayChainInJsx from "./no-inline-array-chain-in-jsx.js";
import noInlineCurriedHandler from "./no-inline-curried-handler.js";
import noInlineGuardChainHandler from "./no-inline-guard-chain-handler.js";
import noInlineObjectParamType from "./no-inline-object-param-type.js";
import noInlineRenderFunction from "./no-inline-render-function.js";
import noJsxInVariable from "./no-jsx-in-variable.js";
import noNestedTry from "./no-nested-try.js";
import noNonHookUsePrefix from "./no-non-hook-use-prefix.js";
import noRenderFnInUsecallback from "./no-render-fn-in-usecallback.js";
import noTestsInDunderFolder from "./no-tests-in-dunder-folder.js";
import noTrivialUsememo from "./no-trivial-usememo.js";
import noUnguardedJsonParse from "./no-unguarded-json-parse.js";
import preferElementRefType from "./prefer-element-ref-type.js";
import preferIncludesOverOrChain from "./prefer-includes-over-or-chain.js";
import preferJsxShortCircuit from "./prefer-jsx-short-circuit.js";
import preferNullishHelpers from "./prefer-nullish-helpers.js";
import preferPositiveCondition from "./prefer-positive-condition.js";
import preferPropsWithChildren from "./prefer-props-with-children.js";
import preferReactnodeOverJsxelementUnion from "./prefer-reactnode-over-jsxelement-union.js";
import preferRoleQueryOverTestid from "./prefer-role-query-over-testid.js";
import preferSomeOverFindCheck from "./prefer-some-over-find-check.js";
import preferStateUpdaterForm from "./prefer-state-updater-form.js";
import requireEffectCleanup from "./require-effect-cleanup.js";
import requireFallbackOnDeepChain from "./require-fallback-on-deep-chain.js";
import requireNumericEnumInitializer from "./require-numeric-enum-initializer.js";
import requireUsestateUserefGeneric from "./require-usestate-useref-generic.js";
import todoTicketRef from "./todo-ticket-ref.js";

export const rules = {
  "filename-convention-by-export-shape": filenameConventionByExportShape,
  "hoist-static-component-constants": hoistStaticComponentConstants,
  "max-params-project": maxParamsProject,
  "no-explicit-undefined-optional": noExplicitUndefinedOptional,
  "no-exported-mutable-state": noExportedMutableState,
  "no-hook-returning-jsx": noHookReturningJsx,
  "no-inline-array-chain-in-jsx": noInlineArrayChainInJsx,
  "no-inline-curried-handler": noInlineCurriedHandler,
  "no-inline-guard-chain-handler": noInlineGuardChainHandler,
  "no-inline-object-param-type": noInlineObjectParamType,
  "no-inline-render-function": noInlineRenderFunction,
  "no-jsx-in-variable": noJsxInVariable,
  "no-nested-try": noNestedTry,
  "no-non-hook-use-prefix": noNonHookUsePrefix,
  "no-render-fn-in-usecallback": noRenderFnInUsecallback,
  "no-tests-in-dunder-folder": noTestsInDunderFolder,
  "no-trivial-usememo": noTrivialUsememo,
  "no-unguarded-json-parse": noUnguardedJsonParse,
  "prefer-element-ref-type": preferElementRefType,
  "prefer-includes-over-or-chain": preferIncludesOverOrChain,
  "prefer-jsx-short-circuit": preferJsxShortCircuit,
  "prefer-nullish-helpers": preferNullishHelpers,
  "prefer-positive-condition": preferPositiveCondition,
  "prefer-props-with-children": preferPropsWithChildren,
  "prefer-reactnode-over-jsxelement-union": preferReactnodeOverJsxelementUnion,
  "prefer-role-query-over-testid": preferRoleQueryOverTestid,
  "prefer-some-over-find-check": preferSomeOverFindCheck,
  "prefer-state-updater-form": preferStateUpdaterForm,
  "require-effect-cleanup": requireEffectCleanup,
  "require-fallback-on-deep-chain": requireFallbackOnDeepChain,
  "require-numeric-enum-initializer": requireNumericEnumInitializer,
  "require-usestate-useref-generic": requireUsestateUserefGeneric,
  "todo-ticket-ref": todoTicketRef,
};
