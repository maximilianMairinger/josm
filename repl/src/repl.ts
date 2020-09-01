import { Data, DataBase, setDataDerivativeIndex, setDataBaseDerivativeIndex, DataCollection, DataSubscription } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"




let historyIndex = constructIndex((a: any) => {return {} as {[timestamp: number]: {[index: number]: string}}})


let { Data: DATA } = setDataDerivativeIndex(
  class Num extends Data<number> {
    static id = "Num"
    inc(by: number = 1) {
      this.set(this.get() + by)
    }
    dec(by: number = 1) {
      this.set(this.get() - by)
    }
  },
  class Str extends Data<string> {
    static id = "Str"

    inject(injection: string, atIndex: number = this.get().length) {
      this.set(this.get().splice(atIndex as any, 0, injection))
    }
    undoInject(injection: string, atIndex: number = this.get().length) {
      this.set(this.get().splice(atIndex + injection.length, injection.length))
    }
  }
).proxy()

let w = 5000

Date.now = () => {
  // w++
  return w
}
 


let d = new DATA("____")
d.get(console.log)
d.inject("injected", 2)
d.undoInject("injected", 2)

let dd = new DATA(2)




let q = new DataBase({q: "qwe", qq: {q: 2}})
q.qq.q.get()




















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




















