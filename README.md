---
description: Object-oriented state manager
---

# Josm

Josm is an \(JS\) **o**bject-oriented **s**tate **m**anager for the web & node, which aims to be both, a lightweight observable \(called Data\) implementation & a feature rich state manager, providing an awesome developer experiance.

> Please note that Josm is currently under development and not yet suited for production

## Usage

Note that the state manager can tree-shaken off the observable implementation using esImports & a properly configured bundler \(e.g. webpack\).

### Observable

#### Data

Observables are called `Data` in Jsom. These are the simplest building blocks as they observe the mutations of one primitive value over time. Or in other words: One Data instance contains one value. As you change that value all prior registered oberv**ers** \(callbacks\) get notified \(called\).

```typescript
import { Data } from "josm"

let data = new Data(1)

data.get(console.log) //Calles (the observer) console.log everytime data is set

data.set(10)
data.set(100)

console.log(data.get()) // This gets the current value of data (100)
```

This would log `1; 10; 100; 100`.

#### DataCollection

To observe multiple values under one obser**ver** nest `Data`s into one `DataCollection`.

```typescript
import { Data, DataCollection } from "josm"

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
import { Data, DataCollection, DataSubscription } from "josm"

let data1 = new Data(1)

let dataSubscription = data.get(console.log)

dataSubscription.deactivate()
data1.set(10)
dataSubscription.activate(/*initialize: boolean = true*/ false)

data1.got(dataSubscription)
data1.get(dataSubscription)


console.log(dataSubscription.data())         // Gets the current data (data1)
console.log(dataSubscription.active())       // Gets the current activae status (true)
console.log(dataSubscription.subscription()) // Gets the current subscription (console.log)


let dataCollection = new DataCollection(new Data(2), new Data(3))

dataSubscription.data(dataCollection, /*initialize: boolean = true*/)
dataSubscription.active(false)
dataSubscription.subscription((d2, d3) => {
  console.log("Custom Subscription", d2, d3)
})
```

--------

#### DataBase

`DataBase`s function similar to `Data`s, only that they are used to store multiple indexed `Data`s (objects / arrays).

```ts
import { DataBase } from "josm"

let db = new DataBase({
  key1: 1,
  key2: 2
  nestedKey: ["a", "b", "c"]
})
```

> Note: Observed objects can be circular

This instance can be traversed like a plain object. The primitive values are wrapped inside `Data`s.

```ts
console.log(db.key1.get())          // 2
console.log(db.nestedKey[2].get())  // "c"
```

All operations concerning more than a primitive can be accessed via the various function overloads on a `DataBase`.

A simple example for this would be to change multiple values of an object.

```ts
db({key1: 11, key2: 22})
console.log(db.key1.get(), db.key2.get())   // 11, 22
```

Adding or deleting properties (`undefined` stands for delete)

```ts
db({key3: 33, key1: undefined})
```

Retriving the whole object

```ts
// once
console.log(db())         // { key2: 22, key3: 33, nestedKey: ["a", "b", "c"] }

// observed
db((ob) => {
  console.log("db", ob)
})
```

> Note: The observer is being invoked every time something below it changes. So when `db.nestedKey[0]` is changed, the event is propergated to all observers above or on it.


The object can also be traversed via an overload

```ts
db("nested", 2).get()   // Aquivilant to db.key2[2].get()
```

Even `Data`s can be used as key here

```ts
import { Data, DataBase } from "jsom"

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
currentLangKey.set("de")                        //            // no chnage ("Cool.io" > "Cool.io") 
```

> Caveat: `name` (and some other properties) cannot be used, as they are already defined on the function object

> Caveat: IntelliSense will show all properties that function has


## Conribute

All feedback is appreciated. Create a pull request or write an issue.

