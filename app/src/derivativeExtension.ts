// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import keyIndex, { constructObjectIndex } from "key-index"



export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeLiableIndex: any[] = []







type DataDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): Data<E[key]>, id?: string }
}


type DataBaseDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): DataBase<E[key]>, id?: string  }
}

function now() {
  return Date.now()
}


function constructProxyInjectionPrototype(historyIndex: ReturnType<typeof makeDataHistoryIndex>) {
  return function proxyInjectionPrototype(Class: {prototype: any, id?: string}) {
    let proto = Class.prototype
    let o = {} as any
    let keys = Object.getOwnPropertyNames(proto).rmV("constructor")

    if (Class.id !== undefined) {
      let index = historyIndex(Class.id)
      for (let key of keys) {
        o[key] = function(...a: any) {
          proto[key](...a)
          index(this)(now()).add(a)
          console.log("Add to history: ", a)
        }
      }
    }
    else {
      for (let key of keys) {
        o[key] = proto[key]
      }
    }
    
    
    
    return o
  }
}

const makeDataHistoryIndex = () => keyIndex((id: string) => keyIndex(() => constructObjectIndex((timeStamp: number) => {return [] as any[][]})))
const dataHistoryIndex = makeDataHistoryIndex()
const dataBaseHistoryIndex = makeDataHistoryIndex()

const dataProxyInjectionPrototype = constructProxyInjectionPrototype(dataHistoryIndex)
const dataBaseProxyInjectionPrototype = constructProxyInjectionPrototype(dataBaseHistoryIndex)



export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): { new<Q> (a: Q): { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] extends never ? Data<Q> : { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] }  {

  const attach = constructAttatchToPrototype(dataDerivativeLiableIndex.Inner("prototype"))
  collection.ea((e) => {
    const q = dataProxyInjectionPrototype(e)
    for (let key in q) {
      attach(key, q[key])
    }
  })

  //@ts-ignore
  return Object.getPrototypeOf(collection.first)
}


export function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): { new<Q> (a: Q): { [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? InstanceType<T[key]> : never }[number] extends never ? DataBase<Q> : { [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? InstanceType<T[key]> : never }[number] } {

  dbDerivativeLiableIndex.clear()

  collection.ea((e) => {
    // DB appends it on its own
    dbDerivativeLiableIndex.add(dataProxyInjectionPrototype(e))
  })

  //@ts-ignore
  return Object.getPrototypeOf(collection.first)
}


