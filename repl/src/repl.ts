import { Data, DataBase, setDataDerivativeIndex, setDataBaseDerivativeIndex, DataCollection } from "../../app/src/josm"









let DATA = setDataDerivativeIndex(
  class Num extends Data<number> {
    constructor(e: number) {
      super(e)
    }
    inc(by: number = 1) {
      this.set(this.get() + by)
    }
    dec(by: number = 1) {
      this.set(this.get() - by)
    }
  },
  class Str extends Data<string> {
    constructor(n: string) {
      super(n)
    }
    append(s: string) {
      //TODO
    }
  }
)

let DATABASE = setDataBaseDerivativeIndex(
  class List extends DataBase<unknown[]> {
    add(a: any) {

    }
  },
  class AnotherArr extends DataBase<string[]> {
    rem(a: any) {

    }
  }
)

let me = ["qwe"]

let db = new DATABASE(me)
db


let d = new DATA(2)
console.log(d.get(console.log))
d.inc()




























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




















