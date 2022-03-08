// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import { DataBaseFunction, RemovePotentialArrayFunctions } from "./dataBase"




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



type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Omit<Func, FunctionProperties>






type MergeDataDerivativeInstance<T extends DataDerivativeCollectionClasses<W>, W extends unknown[], Q> = { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] extends never ? Data<Q> : { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number]
type MergedDataDerivativeClass<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]> = { new<Q> (a: Q): MergeDataDerivativeInstance<T, W, Q> }




export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...classLs: T): {setDataBaseDerivativeIndex: typeof setDataBaseDerivativeIndex, Data: MergedDataDerivativeClass<T, W>}  {
  
  
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


  type RecDataBase<Store extends {[key in string]: any}, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = OptionallyExtendedDB<Store, T, W> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


  type DataBaseify<Type extends object, TT extends DataBaseDerivativeCollectionClasses<WW>, WW extends unknown[]> = { 
    [Key in keyof Type]: Type[Key] extends object ? RecDataBase<RemovePotentialArrayFunctions<Type[Key]>, TT, WW> : MergeDataDerivativeInstance<T, W, Type[Key]>
  }

  type WithDataExtendedDB<Store extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[], S extends RemovePotentialArrayFunctions<Store> = RemovePotentialArrayFunctions<Store>> = DataBaseify<S, T, W> & OmitFunctionProperties<DataBaseFunction<Store>>

  type ExtendedDB<Q extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = { 
    [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? 
      InstanceType<T[key]>
      : never 
  }[number]

  type OptionallyExtendedDB<Q extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = ExtendedDB<Q, T, W> extends never ? WithDataExtendedDB<Q, T, W> : ExtendedDB<Q, T, W>

  function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): { new<Q extends object> (a: Q): WithDataExtendedDB<Q, T, W> } {


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








