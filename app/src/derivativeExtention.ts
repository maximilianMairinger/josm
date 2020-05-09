import { DataBase } from "./dataBase"
import { Data } from "./data"
import { constructAttatchToPrototype } from "attatch-to-prototype"



export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeLiableIndex: any[] = []




type DBClass<E> = { new<T = any> (...a: any): DataBase<E> }



type DataDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): Data<E[key]> }
}


type DBDerivativeCollectionClasses<A extends unknown[] = unknown[]> = {
  [key in keyof A]: DBClass<A[key]>
}






type Inferrr<W> = never extends Data<infer T> ? [W] extends [T] ? Data<W> : void : never


export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): {new<Q> (a: Q): {[key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never}[number]} {

  collection.ea((e) => {
    let attach = constructAttatchToPrototype(dataDerivativeLiableIndex.Inner("prototype"))
    for (let key of Object.getOwnPropertyNames(e.prototype).rmV("constructor")) {
      attach(key, e.prototype[key])
    }
  })

  return collection.first.prototype
}

export function setDataBaseDerivativeIndex<T extends any[], E extends unknown[]>(collection: T & DBDerivativeCollectionClasses<E>): { new<O extends object> (a: O): DataBase<O> & T[number] } {

  dbDerivativeLiableIndex.clear()

  collection.ea((e) => {
    // DB appends it on its own
    dbDerivativeLiableIndex.add(e.prototype)
  })

  return collection.first.prototype
}


