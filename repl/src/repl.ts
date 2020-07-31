import { Data, DataBase, setDataDerivativeIndex, setDataBaseDerivativeIndex, DataCollection } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"





let d = new Data(2)

let i = 0
let f = d.get((e) => {
  i++
  if (i === 1) {if (e !== 4) throw ""}
  else if (i === 2) {if (e !== 2) throw ""}
  else if (i === 3) {if (e !== 4) throw ""}
  else if (i === 4) {throw ""}
}, false)

console.log("test")

d.set(4)
d.got(f)
d.set(123)
d.set(321)
d.set(321)
d.get(f, false)
d.set(2)
d.set(2)
d.got(f)
d.set(4)
d.get(f)
d.set(4)
d.got(f)
d.set(312)


































// let ob = {}
// constructAttatchToPrototype(ob)("ok", () => {
//   console.log("qwe")
// })

// console.log(ob)



// const DATA = setDataDerivativeIndex(
//   class Num extends Data<number> {
//     inc(by: number = 1) {
//       this.set(this.get() + by)
//     }
//     dec(by: number = 1) {
//       this.set(this.get() - by)
//     }
//   },
//   class Str extends Data<string> {
//     append(txt: string) {
//       this.set(this.get() + txt)
//     }
//   }
// )

// let d = new DATA(2)
// d.get(console.log)
// d.inc(2)
// d.dec(4)

// let ds = new DATA("qq")
// ds.get(console.log)
// ds.append("ss")





// interface Person {
//   age: number,
//   firstName: string,
//   lastName: string
// }

// const DATABASE = setDataBaseDerivativeIndex(
//   class Pers extends DataBase<Person> {
//     happyBirthday() {
//       (this.age as any).inc()
//     }
//   }
// )

// let person = new DATABASE({
//   age: 18,
//   firstName: "Max",
//   lastName: "Someone"
// })

// person(console.log)

// person.happyBirthday()



// let db = new DataBase({key1: 1, key2: 2, nested: ["a", "b"]})
// db((e) => console.log(clone(e)))

// db.nested[1].set("c")

// let db2 = db({key2: undefined, key4: 44, key1: "qwe"})
// let e = db2.key1





// console.log("------------------------------------lang--------------------------------")
// let lang = new DataBase({
//   en: {
//     greeting: "Hello",
//     appName: "Cool.oi"
//   },
//   de: {
//     greeting: "Hallo",
//     appName: "Cool.io"
//   }
// })

// let currentLangKey = new Data("en")

// lang(currentLangKey).appName.get(console.log)   // "Cool.oi"  // initially english
// currentLangKey.set("de")                        // "Cool.io"  // now german
// lang.en.appName.set("Cool.io")
// currentLangKey.set("de")    

















// let historyIndex = constructIndex((a: any) => {return {} as {[timestamp: number]: {[index: number]: string}}})


// let DATA = setDataDerivativeIndex(
//   class Num extends Data<number> {
//     static id = "Num"
//     inc(by: number = 1) {
//       this.set(this.get() + by)
//     }
//     dec(by: number = 1) {
//       this.set(this.get() - by)
//     }
//   },
//   class Str extends Data<string> {
//     static id = "Str"
//     inject(injection: string, atIndex: number = this.get().length, atTime: number = Date.now()) {

//       let injectionHistory = historyIndex(this)
//       if (injectionHistory[atTime] === undefined) {
//         let q = injectionHistory[atTime] = {}
//         q[atIndex] = injection
//       }
//       else {
//         let q = injectionHistory[atTime]
//         let n = injectionHistory[atTime] = {}
//         let l = injection.length - 1
//         let keys = Object.keys(q)
//         let start = keys.length



//         for (let i = 0; i < keys.length; i++) {
//           const index = keys[i]
//           if (+index < atIndex) n[index] = q[index]
//           else {
//             start = i
//             break
//           }
//         }
//         n[atIndex] = injection
//         for (let i = start; i < keys.length; i++) {
//           const index = +keys[i]
//           n[index + l] = q[index]
//         }
//       }



      

//       let injectionHistoryKeys = Object.keys(injectionHistory)


//       let value = this.get()
//       let min = 0
//       for (let i = injectionHistoryKeys.length - 1; i >= 0; i--) {
//         const timestamp = +injectionHistoryKeys[i]

//         if (timestamp > atTime) {
//           let injectionHistoryAtTimestamp = injectionHistory[timestamp]
//           for (let index in injectionHistoryAtTimestamp) {
//             index = +index as any
//             value = value.splice(index as any, injectionHistoryAtTimestamp[index as any].length)
//           }
          
//         }
//         else {
//           min = i + 1
//           break
//         }
//       }

//       value = value.splice(atIndex as any, 0, injection)

//       for (let i = injectionHistoryKeys.length - 1; i >= min; i--) {
//         const timestamp = injectionHistoryKeys[i]
        
//         let injectionHistoryAtTimestamp = injectionHistory[timestamp]
//         for (let index in injectionHistoryAtTimestamp) {
//           index = +index as any
//           value = value.splice(index as any, 0, injectionHistoryAtTimestamp[index as any])
//         }
        
//       }

//       this.set(value)
//     }
//   }
// )

// // let DATABASE = setDataBaseDerivativeIndex(
// //   class Auto extends DataBase<{topSpeed: number}> {
// //     drive(meters: number) {
// //       return true
// //     }
// //   }  
// // )

// let w = 5000

// Date.now = () => {
//   // w++
//   return w
// }
 




// let b = true
// let n = 2
// let s = "q"
// let d = new DATA(s)

// d.get(console.log)

// d.inject("hello", 1)
// d.inject("hellow")

// d.inject("___", 0)

// console.log(historyIndex(d))



























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




















