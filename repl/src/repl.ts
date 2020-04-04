import { Data, DataCollection, DataBase } from "../../app/src/josm"
import clone from "fast-copy"








let db = new DataBase({student: {fullName: "Max", age: 17}, teacher: {fullName: "Brein", age: 30}})

let personPath = new Data("student")
let propPath = new Data("fullName")
db(personPath, propPath).get(console.log)


db.student.fullName.set("Maxxe")

propPath.set("age")
personPath.set("teacher")
propPath.set("fullName")




































// class TestMatcher<Matcher extends 2> extends JSONMatcherClass<Matcher> {

//   ok() {
//     return this.data
//   }
// }

// let db = new DataBase({a: {b: 2}, c: "5"})




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
