export function nthIndex(str: string, pat: string, n: number){
  var L= str.length, i= -1;
  while(n-- && i++<L){
      i= str.indexOf(pat, i);
      if (i < 0) break;
  }
  return i;
}

import LinkedList from "fast-linked-list";
import { ReadonlyData, Data, instanceTypeSym, DataSubscription } from "./josm"

type DataChain<T> = ReadonlyData<T> | ReadonlyData<ReadonlyData<T>> | ReadonlyData<ReadonlyData<ReadonlyData<T>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>>>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>>>>>>> | ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<ReadonlyData<T>>>>>>>>>>>

export function flattenNestedData<T>(data: DataChain<T>, subs: DataSubscription<any>[]) {
  
  
  const out = new Data<T>()
  const mySubIndex = subs.length+1
  let innerSub: DataSubscription<any>
  const sub = data.get((innerData) => {
    if (isData(innerData)) {
      for (let i = mySubIndex; i < subs.length; i++) subs[i].deactivate()
      subs.length = mySubIndex
      if (innerSub) innerSub.deactivate()
      innerSub = flattenNestedData(innerData as any, subs).get((innerPlain) => {
        out.set(innerPlain as any)
      })
    }
    else out.set(innerData)
  })
  subs[mySubIndex-1] = sub as any
  
  
  return out
}

export function isData(data: any): data is ReadonlyData<any> {
  return typeof data === "object" && data !== null && data[instanceTypeSym] === "Data"
}

export function isDataDataBase(db: any): db is Data<any> {
  return typeof db === "object" && db !== null && db[instanceTypeSym] === "DataBase"
}