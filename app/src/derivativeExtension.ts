// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"




export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeCollectionIndex: any[] = []



type DataDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): Data<E[key]>, id?: string }
}


type DataBaseDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): DataBase<E[key]>, id?: string  }
}

export interface HistoryIndexAbstract<Value> extends Data<Value> {
  apply(o: {timeStamp: number, id: number | string, args: any[], force?: boolean}): void
}




function classLsToFunctionIndex(clsLs: any[]): any {
  let o = {}
  clsLs.ea(({prototype: p}) => {
    let functionNames = Object.getOwnPropertyNames(p).rmV("constructor")
    for (let fnName of functionNames) {
      o[fnName] = p[fnName]
    }
  })
  return o
}


type MergedDataDerivative<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]> = { new<Q> (a: Q): { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] extends never ? Data<Q> : { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] }



export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...classLs: T): {setDataBaseDerivativeIndex: typeof setDataBaseDerivativeIndex, Data: MergedDataDerivative<T, W> & { proxy: (...settings: any[]) => (MergedDataDerivative<T, W> & { HistoryIndex: { new<Value>(data: Data<Value>): HistoryIndexAbstract<Value> }, contextualIndexing: (...a: any[]) => (MergedDataDerivative<T, W> & { HistoryIndex: { new<Value>(data: Data<Value>): HistoryIndexAbstract<Value> } })})}}  {

  
  const functionIndex = classLsToFunctionIndex(classLs)
  const attachToData = (() => {
    const a = constructAttatchToPrototype(dataDerivativeLiableIndex.map((e) => e.prototype))
    return function attachToData() {
      for (let functionName in functionIndex) {
        a(functionName, functionIndex[functionName])
      }
    }
  })()

  attachToData()

  function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): 
  { 
    new<Q> (a: Q): {
    [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? 
      InstanceType<T[key]> 
      : never 
    }[number] extends never ?
      DataBase<Q>
      : { 
        [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? 
          InstanceType<T[key]>
          : never 
      }[number] 
    } {


    dbDerivativeCollectionIndex.clear()
  
    // DB appends it on its own
    dbDerivativeCollectionIndex.add(...collection)
  
    //@ts-ignore
    return Object.getPrototypeOf(collection.first)
  }
  
  return {
    Data: Object.getPrototypeOf(classLs.first),
    setDataBaseDerivativeIndex
  }
}








