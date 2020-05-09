import { DataBase } from "./josm"
import { Data } from "./josm"
import { constructAttatchToPrototype } from "attatch-to-prototype"



export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeLiableIndex: any[] = []







type DataDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): Data<E[key]> }
}


type DataBaseDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): DataBase<E[key]> }
}





export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): {new<Q> (a: Q): {[key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never}[number] & Data<Q>} {

  collection.ea((e) => {
    let attach = constructAttatchToPrototype(dataDerivativeLiableIndex.Inner("prototype"))
    for (let key of Object.getOwnPropertyNames(e.prototype).rmV("constructor")) {
      attach(key, e.prototype[key])
    }
  })

  //@ts-ignore
  return Data
}


export function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): {new<Q> (a: Q): {[key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? InstanceType<T[key]> : never}[number] & DataBase<Q>} {

  dbDerivativeLiableIndex.clear()

  collection.ea((e) => {
    // DB appends it on its own
    dbDerivativeLiableIndex.add(e.prototype)
  })

  //@ts-ignore
  return DataBase
}


