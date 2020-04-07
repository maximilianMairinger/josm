import { DataBase } from "./dataBase"
import { Data } from "./data"

export function isInstanceofDataBase() {
  
}

export abstract class DataClass<T> {
  constructor(protected data: Data<T>) {

  }
}

export abstract class DataBaseClass<T extends object> {
  constructor(protected dataBase: DataBase<T>) {

  }
}

type PropertyClassIndex = {
  array: DataBaseClass<any[]>
  object: DataBaseClass<object>
  string: DataClass<string>
  number: DataClass<number>
  boolean: DataClass<boolean>
}




type Construc<T extends any[], A extends DataClass<W> | DataBaseClass<W>, W> = {
  [key in keyof T]: {new(e: A): (T[key] & A)}
}


export type PropertyOperationIndex<T extends any[]> = {
  [property in keyof PropertyClassIndex]?: Construc<T, PropertyClassIndex[property]>
}

export const propertyOperationIndex: PropertyOperationIndex<any[]> = {
  array: [
    class extends DataBaseClass<any> {

    }
  ]

}


export function setPropertyOperationIndex() {

}

