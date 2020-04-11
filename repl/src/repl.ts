import { Data, DataBase, setDataDerivativeIndex, DataCollection } from "../../app/src/josm"


setDataDerivativeIndex([
  class Number extends Data<number> {
    inc(by: number = 1) {
      this.set(this.get() + by)
    }
    dec(by: number = 1) {
      this.set(this.get() - by)
    }
  },
  class List extends DataBase<any[]> {
    
  }
])

let d = new DataBase({a: {b: "qwe"}, b: 2})
let sub = d(new DataCollection(new Data("qwe")))






























// let w = new DataBase({w: "qwe"})

// console.log(w)

// let lang = new DataBase({
//   ok: "Alright",
//   what: "Excuse me?!"
// })


// let db = new DataBase({student: {fullName: "Max", age: 17}, teacher: {fullName: "Brein", age: 30}})



// let stud = db(new Data("student"))

// let f;

// lang.ok.get((ok) => {

//   stud(new Data("fullName")).get((e) => {
//     console.log(ok, e)
//   })

// })

// setTimeout(() => {
//   lang.ok.set("Ok")

//   setTimeout(() => {
//     db.student.fullName.set("Maarks")
//   }, 500)
// }, 500)






// TODO: Custom objects. How to create new elements? by default added to base class array (josm serialize style) when creating new.
// Types for db function set object


// TODO: make Datas at the end of DataBase primitives with functions attatched. Or give em valueof and toSTring. Maybe this is the same? (Probably better). Also consider having Data extend Function to enable similar syntax like db with all those overloads.
// Also consider performance of only importing Primitive data shit. Leavin Data as it is could be & supporting this syntax could be done by writing data once and then extending it somehow; or implementing its shit in different contextes -> one with and one without Function as super




























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
