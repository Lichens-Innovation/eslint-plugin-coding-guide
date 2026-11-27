# coding-guide/max-conditional-chain-complexity

Limits how many computed operands a single `||` / `&&` / `??` chain may mix. A chain that packs several computations (arithmetic, ternaries, calls with arguments) into one expression uses short-circuit evaluation as hidden branching — each step deserves a name and an explicit `if`.

A chain is checked only when it contains at least one **anchor** operand: an arithmetic/bitwise expression (`a - b`), a comparison on one (`a - b > 0`), or a ternary. It is reported when its **computed** operands (anchors plus calls/`new` with arguments) exceed `max`. Pure boolean chains such as `isA(x) || isB(y)` or `a === 1 || b === 2` are never reported.

## ❌ Incorrect

```ts
const compareNetworks = (a: AvailableNetwork, b: AvailableNetwork): number =>
  getNetworkRank(a) - getNetworkRank(b) || b.quality - a.quality || a.ssid.localeCompare(b.ssid);
```

## ✅ Correct

```ts
const compareNetworks = (a: AvailableNetwork, b: AvailableNetwork): number => {
  const rankDiff = getNetworkRank(a) - getNetworkRank(b);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  const qualityDiff = b.quality - a.quality;
  if (qualityDiff !== 0) {
    return qualityDiff;
  }

  return a.ssid.localeCompare(b.ssid);
};
```

## Options

- `{ max: number }` — the maximum number of computed operands allowed in one chain. Defaults to `2`.
