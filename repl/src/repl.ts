import { DataSubscription } from "./../../app/src/data"
// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"


const data1 = new Data("val1")
data1.get(() => {})
const data2 = new Data("val2")
data2.get(() => {})


const sub = new DataSubscription(new Data(undefined), (d) => {
  console.log(d)
}, true, false)



sub.data(data1)
data1.set(1)
sub.data(data2)
data2.set(2)
data1.set(11)
sub.data(data1)



