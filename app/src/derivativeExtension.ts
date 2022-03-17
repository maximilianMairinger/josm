// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import { DataBaseFunction, RemovePotentialArrayFunctions } from "./dataBase"




export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeCollectionIndex: {index: {[key in string]: any}} = {index: {}}



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






type MergeDataDerivativeInstance<TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[], Q> = { [key in keyof TT]: InstanceType<TT[key]> extends Data<Q> ? InstanceType<TT[key]> : never }[number] extends never ? Data<Q> : { [key in keyof TT]: InstanceType<TT[key]> extends Data<Q> ? InstanceType<TT[key]> : never }[number]
type MergedDataDerivativeClass<TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = { new<Q> (a: Q): MergeDataDerivativeInstance<TT, WW, Q> }


type RecDataBaseSimple<Store extends {[key in string]: any}, TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = WithDataExtendedDBSimple<Store, TT, WW> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


type DataBaseifySimple<Type extends object, TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = { 
  [Key in keyof Type]: Type[Key] extends object ? RecDataBaseSimple<RemovePotentialArrayFunctions<Type[Key]>, TT, WW> : MergeDataDerivativeInstance<TT, WW, Type[Key]>
}

type WithDataExtendedDBSimple<Store extends {[key in string]: any}, TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = DataBaseifySimple<Store, TT, WW> & OmitFunctionProperties<DataBaseFunction<Store>>

// const Otest = 2 as any as { new<Q extends object, S extends RemovePotentialArrayFunctions<Q> = RemovePotentialArrayFunctions<Q>>(o: Q): WithDataExtendedDBSimple<S, TT, WW>}




type DataBaseDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T> (...a: any[]): DataBase<E[key]> }
}


type RecDataBase<Store extends {[key in string]: any}, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[], TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = OptionallyExtendedDB<Store, T, W, TT, WW> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


type DataBaseify<Type extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[], TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = { 
  [Key in keyof Type]: Type[Key] extends object ? RecDataBase<RemovePotentialArrayFunctions<Type[Key]>, T, W, TT, WW> : MergeDataDerivativeInstance<TT, WW, Type[Key]>
}

type WithDataExtendedDB<Store extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[], TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = DataBaseify<Store, T, W, TT, WW> & OmitFunctionProperties<DataBaseFunction<Store>>

type ExtendedDB<Q extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]> = { 
  [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? 
    InstanceType<T[key]>
    : never 
}[number]

type OptionallyExtendedDB<Q extends object, T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[], TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = ExtendedDB<Q, T, W> extends never ? WithDataExtendedDB<Q, T, W, TT, WW> : ExtendedDB<Q, T, W>




type SetDataBaseDerivativeIndexFunc<TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]> = <T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T) => { new<Q extends object, S extends RemovePotentialArrayFunctions<Q> = RemovePotentialArrayFunctions<Q>> (a: Q): OptionallyExtendedDB<S, T, W, TT, WW> }


export function setDataDerivativeIndex<TT extends DataDerivativeCollectionClasses<WW>, WW extends unknown[]>(...classLs: TT ): {setDataBaseDerivativeIndex: SetDataBaseDerivativeIndexFunc<TT, WW>, Data: MergedDataDerivativeClass<TT, WW>, parseDataBase(DB: typeof DataBase): { new<Q extends object, S extends RemovePotentialArrayFunctions<Q> = RemovePotentialArrayFunctions<Q>>(o: Q): WithDataExtendedDBSimple<S, TT, WW> } }  {
  
  
  const functionIndex = classLsToFunctionIndex(classLs)
  const attachToData = (() => {
    const a = constructAttatchToPrototype(dataDerivativeLiableIndex.map((e) => e.prototype), {enumerable: false})
    return function attachToData() {
      for (let functionName in functionIndex) {
        a(functionName, functionIndex[functionName])
      }
    }
  })()

  attachToData()



  function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): { new<Q extends object, S extends RemovePotentialArrayFunctions<Q> = RemovePotentialArrayFunctions<Q>> (a: Q): OptionallyExtendedDB<S, T, W, TT, WW> } {

  
    // DB appends it on its own
    dbDerivativeCollectionIndex.index = classLsToFunctionIndex(collection)
  
    //@ts-ignore
    return Object.getPrototypeOf(collection.first)
  }
  
  //@ts-ignore 
  return {
    Data: Object.getPrototypeOf(classLs.first),
    setDataBaseDerivativeIndex,
    parseDataBase: (DataBase: { new<O extends object>(): DataBase<O> }) => DataBase as any
  }
}








