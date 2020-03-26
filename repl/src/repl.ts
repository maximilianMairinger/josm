import { Data, DataCollection, DataSubscription, DataBase } from "../../app/src/f-db"
import clone from "tiny-clone"
import { DataBaseLink } from "../../app/src/dataBase"
import attatchToPrototype from "attatch-to-prototype"


// class TestMatcher<Matcher extends 2> extends JSONMatcherClass<Matcher> {

//   ok() {
//     return this.data
//   }
// }

// let db = new DataBase({a: {b: 2}, c: "5"})


let db = new DataBase({ok: 2})
let link = new DataBaseLink(db)


// console.log(link.ok)

// for (let key in link) {
//   console.log(key, link[key])
// }

// for (let key in link) {
//   delete link[key]
// }

// for (let key in link) {
//   console.log(key, link[key])
// }


// let o = {

// }


// let a = attatchToPrototype(o)

// a("ok", () => {
//   console.log("1")
// })



// a("ok", () => {
//   console.log("2")
// })

// o.ok()


let a = new Data("")

let me = new DataSubscription(a, (a) => {

})


