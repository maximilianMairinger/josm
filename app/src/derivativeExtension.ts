// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import { DataBaseFunction, RemovePotentialArrayFunctions } from "./dataBase"




export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeCollectionIndex: any[] = []



type DataDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): Data<E[key]>}
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


export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...classLs: T ): {setDataBaseDerivativeIndex: typeof setDataBaseDerivativeIndex, Data: MergedDataDerivativeClass<T, W>, parseDataBase(DB: typeof DataBase): typeof Otest }  {
  
  
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

  type RecDataBaseSimple<Store extends {[key in string]: any}> = WithDataExtendedDBSimple<Store> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


  type DataBaseifySimple<Type extends object> = { 
    [Key in keyof Type]: Type[Key] extends object ? RecDataBaseSimple<RemovePotentialArrayFunctions<Type[Key]>> : MergeDataDerivativeInstance<T, W, Type[Key]>
  }

  type WithDataExtendedDBSimple<Store extends {[key in string]: any}> = DataBaseifySimple<Store> & OmitFunctionProperties<DataBaseFunction<Store>>

  const Otest = 2 as any as { new<Q extends object, S extends RemovePotentialArrayFunctions<Q> = RemovePotentialArrayFunctions<Q>>(o: Q): WithDataExtendedDBSimple<S>}




  type DataBaseDerivativeCollectionClasses<E extends unknown[]> = {
    [key in keyof E]: { new<T> (...a: any[]): DataBase<E[key]> }
  }


  type RecDataBase<Store extends {[key in string]: any}, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = OptionallyExtendedDB<Store, T, W> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


  type DataBaseify<Type extends object, TT extends DataBaseDerivativeCollectionClasses<WW>, WW extends unknown[]> = { 
    [Key in keyof Type]: Type[Key] extends object ? RecDataBase<RemovePotentialArrayFunctions<Type[Key]>, TT, WW> : MergeDataDerivativeInstance<T, W, Type[Key]>
  }

  type WithDataExtendedDB<Store extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = DataBaseify<Store, T, W> & OmitFunctionProperties<DataBaseFunction<Store>>

  type ExtendedDB<Q extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = { 
    [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? 
      InstanceType<T[key]>
      : never 
  }[number]

  type OptionallyExtendedDB<Q extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = ExtendedDB<Q, T, W> extends never ? WithDataExtendedDB<Q, T, W> : ExtendedDB<Q, T, W>


  function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): { new<Q extends object> (a: Q): OptionallyExtendedDB<Q, T, W> } {


    dbDerivativeCollectionIndex.clear()
  
    // DB appends it on its own
    dbDerivativeCollectionIndex.add(...collection)
  
    //@ts-ignore
    return Object.getPrototypeOf(collection.first)
  }
  
  return {
    Data: Object.getPrototypeOf(classLs.first),
    setDataBaseDerivativeIndex,
    parseDataBase: (DataBase: { new<O extends object>(): DataBase<O> }) => DataBase as any
  }
}








