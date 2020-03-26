# Front db

f-db is a functional based Observable implementation, with a focus on managing state of complex data types (object / arrays). This is especially usefull to responde declaratively to internally (complex UI) or externally (server-side-events / WebSockets) changing application-data.

> Please not that front-db is currently under development and not yet suited for production

## Example

Data is a simple Observable of any primitive property

```js
import { Data } from "front-db"

let numData = new Data(0)

let subscription = numData.subscribe((numVal) => {
  console.log(numVal)  // 0 | 100 | 200
}, /*optinal: initialize: */ true)

numData.val = 100
numData.val = 200

//current value
console.log(numData.val) // 200

numData.unsubscribe(subscription)
```

A DataBase is a collection (object) of Data instances.

```js
import { Data, DataBase } from "front-db"

let db = new DataBase()

```




## Conribute

All feedback is appreciated. Create a pull request or write an issue.
