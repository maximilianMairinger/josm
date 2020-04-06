---
description: Object-oriented state manager
---

# Josm

Josm is an \(JS\) **o**bject-oriented **s**tate **m**anager for the web & node, which aims to be both, a lightweight observable \(called Data\) implementation & a feature rich state manager, providing an awesome developer experiance.

> Please note that Josm is currently under development and not yet suited for production

## Example

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

console.log(data.get()) // This gets the current value of data
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

## Conribute

All feedback is appreciated. Create a pull request or write an issue.

