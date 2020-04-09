import { DataBase } from "./dataBase"
import { Data } from "./data"
import { constructAttatchToPrototype } from "attatch-to-prototype"

export function isInstanceofDataBase() {
  
}


export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeLiableIndex: any[] = []







type DataClass<W> = (W extends object ? Data<W> | DataBase<W> : Data<W>)
type Instance<E = unknown> = {new<T = any>(...a: any[]): DataClass<E>}
type DataDerivativeCollectionClasses<A extends unknown[] = unknown[]> = {
  [key in keyof A]: Instance<A[key]>
}


export function setDataDerivativeIndex<T, E extends unknown[]>(collection: T & DataDerivativeCollectionClasses<E>): void {

  dbDerivativeLiableIndex.clear()

  collection.ea((e, i) => {
    if (e.prototype instanceof Data) {
      let attach = constructAttatchToPrototype(dataDerivativeLiableIndex.Inner("prototype"))
        for (let key in e.prototype) {
          attach(key, e.prototype[key])
        }
    }
    else {
      // DB appends it on its own
      dbDerivativeLiableIndex.add(e.prototype)
    }
  })
}

// setDataDerivativeIndex([
//   class List<T extends string[]> extends DataBase<string[]> {
//     constructor(a: T) {
//       super(a)
//     }
//     qwerqwer(): T {
//       return
//     }
//   },

// ])






// class List<T extends string> extends Data<string> {
//   constructor(a: T) {
//     super(a)
//   }
//   qwerqwer(): T {
//     return
//   }
// }








type E<T> = Data<T> & (any extends List<infer W> ? T extends W ? List<T> : void : void)

let e: E<string>

e
