import { Data, DataBase, DataBaseSubscription, DataCollection, DataSubscription } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"
import { constructObjectIndex } from "key-index"



const db = new DataBase({})
const sub = db((e, diff) => {
  console.log("diff")
  console.log(diff)
}, true) as any as DataBaseSubscription<[{a?: string, b?: string, c?: string}]>

db({
  a: "a",
  b: "b"
})

db({
  c: "c"
})

console.log("deactiv")
sub.deactivate()


db({
  a: "aa",
  c: "cc"
})

db({
  c: "ccc"
})

console.log("active")
sub.activate()









// let data1 = new Data("1")
// let data3: Data<string>
// let d: Data<number>
// let first = true
// data1.get(() => {
//   console.log("d1 call")
//   if (first) {
//     first = false
    
//     data3 = new Data("3")
//     d = data3.tunnel(d => +d)
//   }
  
//   d.get((e) => console.log(e))
//   data3.get((e) => console.log(e))
// })


// data1.set("11")
// data3.set("33")
// data3.set("44")


// let dataA = new Data("a")
// let dataB = new Data("b")

// dataA.get((a) => {
//   console.log(a)
//   dataB.get((b) => {
//     console.log(b)
//   })
// })

// dataA.set("aa")
// dataB.set("bb")