---
description: Object-oriented state manager
---

# Josm

Josm is an \(JS\) **o**bject-oriented **s**tate **m**anager for the web & node, which aims to be both, a lightweight observable \(called Data\) implementation & a feature rich state manager, providing an awesome developer experience.

## Usage

Note that the state manager can tree-shaken off the observable implementation using esImports & a properly configured bundler \(e.g. webpack\).

```ts
import { Data, ... } from "josm"
```

### Observable

#### Data

Observables are called `Data` in Jsom. These are the simplest building blocks as they observe the mutations of one primitive value over time. Or in other words: One Data instance contains one value. As you change that value all prior registered oberv**ers** \(callbacks\) get notified \(called\).

```typescript
let data = new Data(1)

data.get(console.log) // Calls (the observer) console.log every time data is set

data.set(10)
data.set(100)

console.log(data.get()) // This gets the current value of data (100)
```

This would log `1; 10; 100; 100`.

#### DataCollection

To observe multiple values under one obser**ver** nest `Data`s into one `DataCollection`.

```typescript
let data1 = new Data(1)
let data2 = new Data(2)

let dataCollection = new DataCollection(data1, data2)

dataCollection.get(console.log, /*initialize: boolean = true*/ false)

data1.set(10)
data1.set(100)
data2.set(20)
```

This would log `[10, 2]; [100, 2]; [100, 20]`.

#### DataSubscription

Both Data and DataCollection return a `DataSubscription` when subscribing \(via `Data#get(cb)`\). These can be used to manage the subscription state & can be viewed independently of their source \(their source can be changed\).

```typescript
let data1 = new Data(1)

let dataSubscription = data.get(console.log)

dataSubscription.deactivate()
data1.set(10)
dataSubscription.activate(/*initialize: boolean = true*/ false)

data1.got(dataSubscription)
data1.get(dataSubscription)


console.log(dataSubscription.data())         // Gets the current data (data1)
console.log(dataSubscription.active())       // Gets the current active status (true)
console.log(dataSubscription.subscription()) // Gets the current subscription (console.log)


let dataCollection = new DataCollection(new Data(2), new Data(3))

dataSubscription.data(dataCollection, /*initialize: boolean = true*/)
dataSubscription.active(false)
dataSubscription.subscription((d2, d3) => {
  console.log("Custom Subscription", d2, d3)
})
```

--------

### DataBase

`DataBase`s function similar to `Data`s, only that they are used to store multiple indexed `Data`s (objects / arrays).

```ts
let db = new DataBase({
  key1: 1,
  key2: 2
  nestedKey: ["a", "b", "c"]
})
```

> Note: Observed objects can be circular

#### Traversal

This instance can be traversed like a plain object. The primitive values are wrapped inside `Data`s.

```ts
console.log(db.key1.get())          // 2
console.log(db.nestedKey[2].get())  // "c"
```

#### Bulk change

All operations concerning more than a primitive can be accessed via the various function overloads on a `DataBase`.

A simple example for this would be to change multiple values of an object.

```ts
db({key1: 11, key2: 22})
console.log(db.key1.get(), db.key2.get())   // 11, 22
```

#### Bulk add or delete

Adding or deleting properties (`undefined` stands for delete)

```ts
db({key3: 33, key1: undefined})
```

##### Getting

Retrieving the whole object

```ts
// once
console.log(db())         // { key2: 22, key3: 33, nestedKey: ["a", "b", "c"] }

// observed
db((ob) => {
  console.log("db", ob)
})
```

> Note: The observer is being invoked every time something below it changes. So when `db.nestedKey[0]` is changed, the event is propagated to all observers above or on it.

#### Relative traversal

The object can also be traversed via an overload

```ts
db("nested", 2).get()   // Equivalent to db.key2[2].get()
```

Even `Data`s can be used as key here

```ts
let lang = new DataBase({
  en: {
    greeting: "Hello",
    appName: "Cool.oi"
  },
  de: {
    greeting: "Hallo",
    appName: "Cool.io"
  }
})

let currentLangKey = new Data("en")

lang(currentLangKey).appName.get(console.log)   // "Cool.oi"  // initially english
currentLangKey.set("de")                        // "Cool.io"  // now german
lang.en.appName.set("Cool.io")
currentLangKey.set("de")                        //            // no change ("Cool.io" > "Cool.io") 
```

> Caveat: `name` (and some other properties) cannot be used, as they are already defined on the function object

> Caveat: IntelliSense will show all properties that function has


### Derivables

With the above interface virtually every manipulation is possible, but often not very handy.

> What increasing a number / appending to a string would look like

```ts
let num = new Data(2)
num.set(num.get() + 1)

let str = new Data("Hel")
str.set(str.get() + "lo")
```

Thats what derivables solve. Defining repeated manipulation processes once, directly on the type it is made for.

```ts
const DATA = setDataDerivativeIndex(
  class Num extends Data<number> {
    inc(by: number = 1) {
      this.set(this.get() + by)
    }
    dec(by: number = 1) {
      this.set(this.get() - by)
    }
  },
  class Str extends Data<string> {
    append(txt: string) {
      this.set(this.get() + txt)
    }
  }
)
```

With this declared, it can be used on the fly as the typing adapts.

> Note: While this example is really just about convenience, it excels when defining more complex procedures (like injecting something into a string, etc.)

```ts
let num = new DATA(2)
num.inc()

let str = new DATA("Hel")
str.append("lo")
```

> Caveat: No function name can be used twice withing all dataDerivables or within all dataBaseDerivables.

While derivable usage on `Data`s is substantial on its own, applying it to certain interfaces `DataBases`s does provide seamless interaction on a very high level.

```ts
interface Person {
  age: number,
  firstName: string,
  lastName: string
}

const DATABASE = setDataBaseDerivativeIndex(
  class Pers extends DataBase<Person> {
    happyBirthday() {
      this.age.inc()
    }
  }
)

let person = new DATABASE({
  age: 18,
  firstName: "Max",
  lastName: "Someone"
})

person.happyBirthday()
```


### Specifics

#### Subscription pertinention

When nesting observer declarations in synchronous code (which would without precautions result in a memory leak), josm tries to unsubscribe the old (unused) subscription in favor of the new one.

> Bad practice: In real code, use a [`DataCollection`](#DataCollection) instead. While this would work (without a memory leak), it is not clean nor performant and breaks when the data1 callback were asynchronous. This may however be unavoidable in some situations. The following however is just for demonstration.

```ts
let data1 = new Data("value1")
let data2 = new Data("value2")

data1.get((d1) => {
  data2.get((d2) => {
    console.log(d1, d2)
  })
})
```


## Contribute

All feedback is appreciated. Create a pull request or write an issue.

