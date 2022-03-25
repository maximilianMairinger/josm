// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import { DataBaseFunction, RemovePotentialArrayFunctions } from "./dataBase"




export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeCollectionIndex: {index: {[key in string]: any}} = {index: {}}







function classLsToFunctionIndex(clsLs: any[]): any {
  let o = {}
  for (const {prototype: p} of clsLs) {
    if (p === undefined) continue
    const functionNames = Object.getOwnPropertyNames(p).rmV("constructor")
    for (let fnName of functionNames) {
      o[fnName] = p[fnName]
    }
  }
  return o
}



type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Omit<Func, FunctionProperties>


// just for reference; must be inserted into function paremater as otherwise WW cannot be infered. It is crutially important for performance that new(a: any)... doesnt have any generic property. Use the static type peroperty for type inference 
type DataExtensionClass<WW extends unknown[]> = { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }
type DataBaseExtensionClass<W extends unknown[]> = { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }

type OptionallyExtendedDataClass<TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = {
  new<Value, _Default extends Value = Value> (a: Value, alt?: _Default): OptionallyExtendedData<TT, WW, Value, _Default>
}


export type ExtendedData<TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[], Value, _Default extends Value = Value> = {
  [key in (keyof WW)]: Value extends WW[key] ? InstanceType<TT[key]> : never
}[number]

export type OptionallyExtendedData<TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[], Value, _Default extends Value = Value> = ExtendedData<TT, WW, Value, _Default> extends never ? Data<Value, _Default> : (Omit<ExtendedData<TT, WW, Value, _Default>, keyof Data<Value, _Default>> & Data<Value, _Default>)


type RecDataBaseSimple<Store extends {[key in string]: any}, TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = WithDataExtendedDBSimple<Store, TT, WW> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


type DataBaseifySimple<Type extends object, TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = { 
  [Key in keyof Type]: Type[Key] extends object ? RecDataBaseSimple<Type[Key], TT, WW> : OptionallyExtendedData<TT, WW, Type[Key]>
}

type WithDataExtendedDBSimple<Store extends {[key in string]: any}, TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = DataBaseifySimple<RemovePotentialArrayFunctions<Store>, TT, WW> & OmitFunctionProperties<DataBaseFunction<RemovePotentialArrayFunctions<Store>>>





type RecDataBase<Store extends {[key in string]: any}, T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[], TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = OptionallyExtendedDataBase<Store, T, W, TT, WW> /* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/


type DataBaseify<Type extends object, T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[], TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = { 
  [Key in keyof Type]: Type[Key] extends object ? RecDataBase<Type[Key], T, W, TT, WW> : OptionallyExtendedData<TT, WW, Type[Key]>
}

type WithDataExtendedDB<Store extends object, T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[], TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = DataBaseify<RemovePotentialArrayFunctions<Store>, T, W, TT, WW> & OmitFunctionProperties<DataBaseFunction<RemovePotentialArrayFunctions<Store>>>

// type UnionToIntersection<U> = 
//   (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never



// type Test = UnionToIntersection<[{lol: string}, {lel: string}, never][never]>
// type Test2 = UnionToIntersection<{lol: string} | {lel: string} | never>



type ExtendedDB<Q extends object, T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[]> = { 
  [key in keyof W]: Q extends W[key] ? 
    InstanceType<T[key]>
    : never
}[number]
// 
export type OptionallyExtendedDataBase<Q extends object, T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[], TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]>
 = ExtendedDB<Q, T, W> extends never ? WithDataExtendedDB<Q, T, W, TT, WW> : (ExtendedDB<Q, T, W> & WithDataExtendedDB<Q, T, W, TT, WW>)


export type OptionallyExtendedDataBaseClass<T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[], TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = { new<Q extends object> (a: Q): OptionallyExtendedDataBase<Q, T, W, TT, WW> }


type SetDataBaseDerivativeIndexFunc<TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]> = <T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[]>(...collection: { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } } & T) => { 
  types: {w: W, t: T}
  DataBase: OptionallyExtendedDataBaseClass<T, W, TT, WW>
}


export function setDataDerivativeIndex<TT extends { [key in keyof WW]: { type: WW[key], new(a: any): Data<WW[key]> } }, WW extends unknown[]>(...classLs: { [key in keyof WW]: {type: WW[key]} } & TT): {
  setDataBaseDerivativeIndex: SetDataBaseDerivativeIndexFunc<TT, WW>, 
  Data: OptionallyExtendedDataClass<TT, WW>, types: {tt: TT, ww: WW}, 
  parseDataBase(DB: typeof DataBase): { 
    new<Q extends object>(o: Q): WithDataExtendedDBSimple<Q, TT, WW> 
  } 
}  {
  
  
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



  function setDataBaseDerivativeIndex<T extends { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }, W extends unknown[]>(...collection: { [key in keyof W]: { type: W[key], new(a: any): DataBase<W[key]> } }): { 
    new<Q extends object> (a: Q): OptionallyExtendedDataBase<Q, T, W, TT, WW>
  } {

  
    // DB appends it on its own
    dbDerivativeCollectionIndex.index = classLsToFunctionIndex(collection)
  
    //@ts-ignore
    return {
      //@ts-ignore
      DataBase: Object.getPrototypeOf(collection.first)
    }
  }
  
  //@ts-ignore 
  return {
    Data: Object.getPrototypeOf(classLs.first),
    //@ts-ignore
    setDataBaseDerivativeIndex,
    parseDataBase: (DataBase: { new<O extends object>(): DataBase<O> }) => DataBase as any
  }
}






