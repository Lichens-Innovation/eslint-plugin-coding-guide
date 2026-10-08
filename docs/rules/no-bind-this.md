# coding-guide/no-bind-this

Disallows `.bind(this)` — use an arrow function instead, which captures `this` lexically and reads more clearly.

## ❌ Incorrect

```ts
class Counter {
  private count = 0;

  increment() {
    this.count += 1;
  }

  incrementAll(times: number[]) {
    times.forEach(this.increment.bind(this));
  }
}
```

## ✅ Correct

```ts
class Counter {
  private count = 0;

  increment() {
    this.count += 1;
  }

  incrementAll(times: number[]) {
    times.forEach(() => this.increment());
  }
}
```

## Options

This rule has no options.
