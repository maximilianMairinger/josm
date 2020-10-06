import { Data, DataBase, DataCollection, DataSubscription } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"
import { constructObjectIndex } from "key-index"


let data1 = new Data("1")
let data3: Data<string>
let d: Data<number>
let first = true
data1.get(() => {
  console.log("d1 call")
  if (first) {
    first = false
    
    data3 = new Data("3")
    d = data3.tunnel(d => +d)
  }
  
  d.get((e) => console.log(e))
  data3.get((e) => console.log(e))
})


data1.set("11")
data3.set("33")
data3.set("44")
