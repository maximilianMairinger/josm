import { DataBase } from "./dataBase"
import { Data } from "./data"

export function isInstanceofDataBase() {
  
}

export const dataDerivativeIndex: DataDerivativeIndex<DataDerivativeIndexInstances> = {
  array: undefined,
  object: undefined,
  string: undefined,
  number: undefined,
  boolean: undefined
}


type BaseDataDerivativeIndex = {
  array: DataBase<any[]> | Data<any[]>
  object: DataBase<object> | Data<object>
  string: Data<string>
  number: Data<number>
  boolean: Data<boolean>
}

type DataDerivativeIndexInstances = {
  [key in keyof BaseDataDerivativeIndex]: {new<T = any>(...a: any[]): BaseDataDerivativeIndex[key]}[]
}




type DataDerivativeIndex<Of extends {[key in string]: any[]}> = {
  [key in keyof Of]?: Of[key]
}




export function setDataDerivativeIndex<T extends {[key in string]: any[]}>(index: DataDerivativeIndex<T> & DataDerivativeIndex<DataDerivativeIndexInstances>): void {
  for (let key in dataDerivativeIndex) {
    dataDerivativeIndex[key] = []
  }
  for (let key in index) {
    dataDerivativeIndex[key] = index[key]

    index[key].ea((e) => {
      if (e.prototype instanceof Data) {
        for (let key in e.prototype) {
          Data.prototype[key] = e.prototype[key]
        }
      }
    })
    
  }
}

setDataDerivativeIndex({
  array: [
    class List<T extends string[]> extends Data<string[]> {
      constructor(a: T) {
        super(a)
      }
      qwerqwer(): T {
        return
      }
    }
  ]
})




