import { Data, DataBase, DataCollection, DataSubscription } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"
import { constructObjectIndex } from "key-index"


let data1 = new Data("1")
let data2 = new Data("2")
data1.get(() => {
  data2.get(console.log)
})


data2.set("22")
data1.set("11")
