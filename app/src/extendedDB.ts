import { Data as DATA, DataSubscription, DataBaseSubscription } from "./data"
import { DataBase as DATABASE, RemovePotentialArrayFunctions } from "./dataBase"
import { setDataDerivativeIndex, OptionallyExtendedData, OptionallyExtendedDataBase } from "./derivativeExtension"




const { Data: _Data, types: DataTypes, setDataBaseDerivativeIndex, parseDataBase } = setDataDerivativeIndex(
  class NumberData extends DATA<number> {
    static type: number;
    inc<T extends ReturnType<typeof this["get"]> = ReturnType<typeof this["get"]>>(by: number = 1) {
      this.set((this.get() as any + by))
      return 2 as T
    }
  }
)



const ExDataBase = parseDataBase(DATABASE)

type RemoveCallback = () => void

interface ArrayList<T> extends DATABASE<T[]> {
  forEach(addedCb: (added: T extends object ? DATABASE<T> : DATA<T>) => (DataSubscription<[...any[]]> | (() => void))): DataBaseSubscription<[T[]]>
  add(what: T): RemoveCallback
}

type ArrayListClass<T> = { new(a: any): ArrayList<T>, type: T[] }
const dummyObject = {} as any

const { DataBase: _DataBase, types: DataBaseTypes } = setDataBaseDerivativeIndex(
  dummyObject as ArrayListClass<object>,
  dummyObject as ArrayListClass<symbol>,
  dummyObject as ArrayListClass<boolean>,
  dummyObject as ArrayListClass<string>,
  dummyObject as ArrayListClass<number>,
  dummyObject as ArrayListClass<number | object | symbol | boolean | string>,
  class ArrayList extends ExDataBase<number[]> {
    static type: number[];
    forEach(addedCb: (added: DATA<number>, i: number) => ((() => void) | DataSubscription<[...any[]]> | void), init: boolean = true): DataBaseSubscription<[object[]]> {
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
    add(what: number) {
      const i = (this() as any as any[]).length
      const ob = {}
      ob[i] = what
      this(ob)
      return () => {
        const ob = {}
        ob[i] = undefined
        this(ob)
      }
    }
  } as never
)





export type Data<Value, _Default extends Value = Value> = OptionallyExtendedData<typeof DataTypes["tt"], typeof DataTypes["ww"], Value, _Default>
export type DataBase<Store extends object> = OptionallyExtendedDataBase<Store, typeof DataBaseTypes["t"], typeof DataBaseTypes["w"], typeof DataTypes["tt"], typeof DataTypes["ww"]>
