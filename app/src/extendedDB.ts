import { Data as DATA, DataBase as DATABASE, DataSubscription, setDataDerivativeIndex } from "../../app/src/josm"
import { DataBaseSubscription } from "./data"


const { Data: _Data, setDataBaseDerivativeIndex, parseDataBase } = setDataDerivativeIndex(
  class NumberData<T extends number> extends DATA<T> {
    inc(by: number = 1) {
      this.set((this.get() as any + by))
      return this
    }
  }
)

export const Data = _Data


const ExDataBase = parseDataBase(DATABASE)



export const DataBase = setDataBaseDerivativeIndex(
  class ArrayList<T extends number> extends ExDataBase<T[]> {
    // @ts-ignore
    forEach(addedCb: (added: DATA<T>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void), init?: boolean): DataBaseSubscription<[number[]]> {}
    // @ts-ignore
    add(what: T): () => void {}
  },
  class ArrayList<T extends boolean> extends ExDataBase<T[]> {
    // @ts-ignore
    forEach(addedCb: (added: DATA<T>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void), init?: boolean): DataBaseSubscription<[boolean[]]> {}
    // @ts-ignore
    add(what: T): () => void {}
  },
  class ArrayList<T extends string> extends ExDataBase<T[]> {
    // @ts-ignore
    forEach(addedCb: (added: DATA<T>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void), init?: boolean): DataBaseSubscription<[string[]]> {}
    // @ts-ignore
    add(what: T): () => void {}
  },
  class ArrayList<T extends object> extends ExDataBase<T[]> {
    forEach(addedCb: (added: DATABASE<T[]>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void), init: boolean = true): DataBaseSubscription<[object[]]> {
      const destroyMap = new Map<DATA, Function>()

      const sub = this((full, added, removed) => {
        for (const key in added) {
          const numKey = +key
          if (isNaN(numKey)) continue
          const ret = addedCb((this as any)[key], numKey)
          if (ret instanceof DataSubscription) destroyMap.set((this as any)[key], ret.deactivate.bind(ret))
          else if (ret instanceof Function) destroyMap.set((this as any)[key], ret)
        }

        for (const key in removed) {
          const numKey = +key
          if (isNaN(numKey)) continue
          if (destroyMap.has((removed as any)[key])) {
            destroyMap.get((removed as any)[key])()
            destroyMap.delete((removed as any)[key])
          }
        }

      }, false, init)

      return sub as any
    }
    add(what: T) {
      const i = (this() as any[]).length
      const ob = {}
      ob[i] = what
      this(ob)
      return () => {
        const ob = {}
        ob[i] = undefined
        this(ob)
      }
    }
  },
  
  class WutOBase extends ExDataBase<{wut: number}> {
    incWut(by: number = 1) {
      this.wut.inc(by)
      return this
    }
  }
)



export type Data<Value = unknown, _Default extends Value = Value> = DATA<Value, _Default>
export type DataBase<Store extends {[key in string]: any} = unknown> = DATABASE<Store>
