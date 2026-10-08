# coding-guide/no-mobx-reaction

Disallows MobX `reaction` — it runs side effects implicitly whenever observed state changes, which makes the data flow hard to debug, investigate and follow. Derive values with `computed`, or trigger the side effect explicitly from the action that changes the state.

## ❌ Incorrect

```ts
import { makeAutoObservable, reaction } from "mobx";

class UserStore {
  userId = "";
  profile?: Profile;

  constructor() {
    makeAutoObservable(this);
    reaction(
      () => this.userId,
      (userId) => this.loadProfile(userId)
    );
  }

  setUserId(userId: string) {
    this.userId = userId;
  }
}
```

## ✅ Correct

```ts
import { makeAutoObservable } from "mobx";

class UserStore {
  userId = "";
  profile?: Profile;

  constructor() {
    makeAutoObservable(this);
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.loadProfile(userId);
  }
}
```

## Options

This rule has no options.
