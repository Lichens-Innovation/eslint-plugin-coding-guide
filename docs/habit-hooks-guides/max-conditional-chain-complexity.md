`rankA - rankB || b.quality - a.quality || a.ssid.localeCompare(b.ssid)` hides three branches inside one expression: a reader has to know that `0` is falsy, mentally evaluate each operand and work out which one actually decides the result. Every extra computed operand adds another concept to untangle in a single line.

**What triggers**: an outermost `||` / `&&` / `??` chain (operators may be mixed) containing at least one anchor — an arithmetic/bitwise expression, a comparison on one, or a ternary — and more computed operands than `max` (default `2`; option `{ max }`). Computed operands are anchors plus calls/`new` with arguments; `await`, optional chains (`?.`) and `as`/`!`/`satisfies` wrappers are looked through, including around nested chains. Pure boolean chains (`isA(x) || isB(y)`, `a === 1 || b === 2`) never trigger. No autofix.

**Fix**:

1. Give each computed step a named `const` (`rankDiff`, `qualityDiff`) that says what it measures.
2. Branch explicitly with early returns: `if (rankDiff !== 0) return rankDiff;`, then the next step, then the final fallback.
3. Comparators: one `const` + `if` per sort key, last key returned directly.
4. Long boolean conditions mixing computations: extract each into a named boolean (`const isOverLimit = used - limit > 0;`) and combine the names.

**AVOID**:

- Replacing the chain with nested ternaries — same hidden branching, harder to read.
- Moving the whole chain into a helper unchanged just to shrink the line.
- Raising `max` locally instead of splitting the expression.

{% include "includes/line_level_issues.md" %}
