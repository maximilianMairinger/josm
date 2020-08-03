// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import keyIndex, { constructObjectIndex } from "key-index"
import { Subscription, DataSubscription } from "./data"
import { AnyNaptrRecord } from "dns"



export const dataDerivativeLiableIndex: any[] = []
export const dbDerivativeLiableIndex: any[] = []







type DataDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): Data<E[key]>, id?: string }
}


type DataBaseDerivativeCollectionClasses<E extends unknown[]> = {
  [key in keyof E]: { new<T = unknown> (...a: any[]): DataBase<E[key]>, id?: string  }
}

function now() {
  return Date.now()
}



function constructProxyInjectionPrototype() {
  let initialProxySymbol = Symbol("initialProxy")
  let idToFunctionNameIndex: {[id in number]: string} = {}
    let functionNameToIdIndex: {[functionName in string]: number} = {}
  let proxy = false
  return {
    initialProxySymbol,
    idToFunctionNameIndex,
    functionNameToIdIndex,
    setProxy,
    proxyInjectionPrototype
  }

  function setProxy(to: boolean) {
    proxy = to
  }

  let currentId = 0
    

  function proxyInjectionPrototype(Class: {prototype: any}) {
    let proto = Class.prototype
    let o = {} as any
    let functionNames = Object.getOwnPropertyNames(proto).rmV("constructor")

    if (!proxy) {
      for (let key of functionNames) {
        o[key] = proto[key]
      }
    }
    else {
      for (let name of functionNames) {
        idToFunctionNameIndex[functionNameToIdIndex[name] = currentId++] = name
        let isInitialProxy: boolean = false
        o[name] = function(...args: any) {
          if (this[initialProxySymbol as any] === undefined) {
            this[initialProxySymbol as any] = {name, args}
            isInitialProxy = true
          }
          proto[name].apply(this, args)
          if (isInitialProxy) {
            isInitialProxy = false
            delete this[initialProxySymbol as any]
          }
        }
      }
    }
    return o
  }
}


interface HistoryIndexAbstract<Value> extends Data<Value> {
  set(value: Value): Value
  set(value: Value, proxyParams: {timeStamp: number, name: string, args: any[], force?: boolean}): Value
}


type MergedDataDerivative<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]> = { new<Q> (a: Q): { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] extends never ? Data<Q> : { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] }
export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): MergedDataDerivative<T, W> & { proxy: () => {Data: MergedDataDerivative<T, W>, HistoryIndex: { new<Value>(data: Data<Value>): HistoryIndexAbstract<Value> }} }  {
  let { setProxy, proxyInjectionPrototype, idToFunctionNameIndex, functionNameToIdIndex, initialProxySymbol } = constructProxyInjectionPrototype()

  function apply() {
    const attach = constructAttatchToPrototype(dataDerivativeLiableIndex.Inner("prototype"))
    collection.ea((e) => {
      const q = proxyInjectionPrototype(e)
      for (let key in q) {
        attach(key, q[key])
      }
    })
  }
  apply()

  let end: any = Object.getPrototypeOf(collection.first)
  end.proxy = () => {
    setProxy(true)
    apply()


    class HistoryIndex<Value = unknown> extends Data<Value> {
      private link: DataSubscription<[Value]>
      private historyIndex = constructObjectIndex((timeStamp: number) => constructObjectIndex((functionId: number) => {return [] as Args[]}))
    
      constructor(private data: Data<Value>) {
        super(data.get())
        this.link = data.get(super.set.bind(this), false)
    
        this.get(() => {
          let thisInitProxy: {name: string, args: any[]} = this.data[initialProxySymbol] !== undefined ? this.data[initialProxySymbol] : "get"
          
        })
      }
    
      public set(value: Value): Value
      public set(value: Value, proxyParams : {timeStamp: number, name: string, args: any[], force?: boolean}): Value
      public set(value: Value, proxyParams?: {timeStamp: number, name: string, args: any[], force?: boolean}): Value {
        this.link.deactivate()
        
        if (proxyParams !== undefined) {
          let localArgsIndex = this.historyIndex(proxyParams.timeStamp)(functionNameToIdIndex[proxyParams.name])
          if (!localArgsIndex.empty && !proxyParams.force) throw new LocalHistoryInconsistencyWithServer()
          else {
            
            let morphData = new Data(this.get())
            let currentHistoryIndex = this.historyIndex()

            let timeStamps = Object.keys(currentHistoryIndex)
            let givenTimeStamp = proxyParams.timeStamp
            for (let i = timeStamps.length - 1; i >= 0; i--) {
              if (givenTimeStamp >= +timeStamps[i]) break
              let functionIndex = currentHistoryIndex[timeStamps[i]]
              for (let functionName in functionIndex) {
                let argsLs = functionIndex[functionName] as any[][]
                for (let i = argsLs.length; i >= 0; i--) {
                  morphData[calculateReverseFunctionName(functionName)](...argsLs[i])  
                }
              }
            }
            
            
          }
        }
        else {
          this.value = value
          this.data.set(value)
        }
    
        
        this.link.activate()
        return value
      }
    }
    


    return {
      Data: end,
      HistoryIndex
    }
  }
  return end
}


// export function setDataBaseDerivativeIndex<T extends DataBaseDerivativeCollectionClasses<W>, W extends unknown[]>(...collection: T): { new<Q> (a: Q): { [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? InstanceType<T[key]> : never }[number] extends never ? DataBase<Q> : { [key in keyof T]: InstanceType<T[key]> extends DataBase<Q> ? InstanceType<T[key]> : never }[number] } {

//   let initialProxySymbol = Symbol("initialProxy")
//   let proxyInjectionPrototype = constructProxyInjectionPrototype(initialProxySymbol)

//   dbDerivativeLiableIndex.clear()

//   collection.ea((e) => {
//     // DB appends it on its own
//     dbDerivativeLiableIndex.add(proxyInjectionPrototype(e))
//   })

//   //@ts-ignore
//   return Object.getPrototypeOf(collection.first)
// }

type Args = any[]

export class LocalHistoryInconsistencyWithServer extends Error {}

const reverseKeyword = "undo"
function calculateReverseFunctionName(name: string) {
  if (name.startsWith(reverseKeyword) && name.charAt(4).isUpperCase()) return name.charAt(4).toLowerCase() + name.substring(5)
  else return reverseKeyword + name.capitalize()
}
