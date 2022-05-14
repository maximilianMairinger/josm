// import { Data as DATA, DataBase as DATABASE, DataBaseSubscription, DataCollection, DataSubscription, setDataDerivativeIndex } from "../../app/src/josm"
// import constructIndex from "key-index"
// import constructAttatchToPrototype from "attatch-to-prototype"
// import clone from "fast-copy"
// import { constructObjectIndex } from "key-index"



// const { Data: _Data, setDataBaseDerivativeIndex, parseDataBase } = setDataDerivativeIndex(
//   class NumberData<T extends number> extends DATA<T> {
//     inc(by: number = 1) {
//       this.set((this.get() as any + by))
//       return this
//     }
//   }
// )

// export const Data = _Data


// const ExDataBase = parseDataBase(DATABASE)



// export const DataBase = setDataBaseDerivativeIndex(
//   class ArrayList<T extends number> extends ExDataBase<T[]> {
//     forEach(addedCb: (added: DATA<T>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void)) {}
//     // @ts-ignore
//     add(what: T): () => void {}
//   },
//   class ArrayList<T extends boolean> extends ExDataBase<T[]> {
//     forEach(addedCb: (added: DATA<T>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void)) {}
//     // @ts-ignore
//     add(what: T): () => void {}
//   },
//   class ArrayList<T extends string> extends ExDataBase<{[key in number]: T}> {
//     forEach(addedCb: (added: DATA<T>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void)) {}
//     // @ts-ignore
//     add(what: T): () => void {}
//   },
//   class ArrayList<T extends object> extends ExDataBase<T[]> {
//     forEach(addedCb: (added: DATABASE<T[]>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void)) {
//       const destroyMap = new Map<DATA, Function>()

//       this((full, added, removed) => {
//         for (const key in added) {
//           const numKey = +key
//           if (isNaN(numKey)) continue
//           const ret = addedCb((this as any)[key], numKey)
//           if (ret instanceof DataSubscription) destroyMap.set((this as any)[key], ret.deactivate.bind(ret))
//           else if (ret instanceof Function) destroyMap.set((this as any)[key], ret)
//         }

//         for (const key in removed) {
//           const numKey = +key
//           if (isNaN(numKey)) continue
//           if (destroyMap.has((removed as any)[key])) {
//             destroyMap.get((removed as any)[key])()
//             destroyMap.delete((removed as any)[key])
//           }
//         }

//       }, false, false)


//       for (const key in this) {
//         const numKey = +key
//         if (isNaN(numKey)) continue
//         const ret = addedCb((this as any)[key], numKey)
//         if (ret instanceof DataSubscription) destroyMap.set((this as any)[key], ret.deactivate.bind(ret))
//         else if (ret instanceof Function) destroyMap.set((this as any)[key], ret)
//       }

//     }
//     add(what: T) {
//       const i = (this() as any[]).length
//       const ob = {}
//       ob[i] = what
//       this(ob)
//       return () => {
//         const ob = {}
//         ob[i] = undefined
//         this(ob)
//       }
//     }
//   },
  
//   class WutOBase extends ExDataBase<{wut: number}> {
//     incWut(by: number = 1) {
//       this.wut.inc(by)
//       return this
//     }
//   }
// )



// export type Data<Value = unknown, _Default extends Value = Value> = DATA<Value, _Default>
// export type DataBase<Store extends {[key in string]: any} = unknown> = DATABASE<Store>

// // const db = new DataBase(["lelelell"])

// // db.forEach((added) => {
// //   console.log("added", added.get())
// //   const sub = added.get((val) => {
// //     console.log("changed", val)
// //   }, false)

// //   return () => {
// //     console.log("removed", added.get())
// //     sub.deactivate()
// //   }
// // })

// // console.log("init done")


// // db([1,2], true)
// // db.add("hellow")()


// // // @ts-ignore
// // window.db = db


// // console.log(new Data(2).inc(2).get())












// // const db = new DataBase({
// //   helloKey: "HELLO"
// // }, {
// //   helloKey: "helloDefault"
// // })

// // db((e, q) => {
// //   console.log(e, q)
// // })

// // // db.helloKey.set(undefined)
// // db(undefined, true)


// // console.log("done")








// // const data = new DataBase({lol: "aa"})
// // const sub1 = data((e) => {
// //   console.log("sub1", e)o
// // })

// // const sub2 = data((e) => {
// //   console.log("sub2", e)
// // })
// // const sub3 = data((e) => {
// //   console.log("sub3", e)
// // })

// // debugger
// // sub2.deactivate()
// // sub1.deactivate()
// // sub2.activate()


// // data({lol: "bb"})

// // sub.setToDataBase({lol: "cc"})




// // const db = new DataBase({})
// // const sub = db((e, diff) => {
// //   console.log("diff")
// //   console.log(diff)
// // }, true) as any as DataBaseSubscription<[{a?: string, b?: string, c?: string}]>

// // db({
// //   a: "a",
// //   b: "b"
// // })

// // db({
// //   c: "c"
// // })

// // console.log("deactiv")
// // sub.deactivate()


// // db({
// //   a: "aa",
// //   c: "cc"
// // })

// // db({
// //   c: "ccc"
// // })

// // console.log("active")
// // sub.activate()









// // let data1 = new Data("1")
// // let data3: Data<string>
// // let d: Data<number>
// // let first = true
// // data1.get(() => {
// //   console.log("d1 call")
// //   if (first) {
// //     first = false
    
// //     data3 = new Data("3")
// //     d = data3.tunnel(d => +d)
// //   }
  
// //   d.get((e) => console.log(e))
// //   data3.get((e) => console.log(e))
// // })


// // data1.set("11")
// // data3.set("33")
// // data3.set("44")


// // let dataA = new Data("a")
// // let dataB = new Data("b")

// // dataA.get((a) => {
// //   console.log(a)
// //   dataB.get((b) => {
// //     console.log(b)
// //   })
// // })

// // dataA.set("aa")
// // dataB.set("bb")