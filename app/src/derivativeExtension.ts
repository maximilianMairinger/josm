// JUST TYPES
import { DataBase } from "./josm"
import { Data } from "./josm"


import { constructAttatchToPrototype } from "attatch-to-prototype"
import keyIndex, { constructObjectIndex } from "key-index"
import { Subscription, DataSubscription } from "./data"



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
  let historyBridge = Symbol("history")
  let idToFunctionNameIndex: {[id in number]: string} = {0: "set"}
  let functionNameToIdIndex: {[functionName in string]: number} = {set: 0}
  let currentId = 1
  let contextualNoteBridge = Symbol("contextualNote")


  return {
    historyBridge,
    idToFunctionNameIndex,
    functionNameToIdIndex,
    proxyInjectionPrototype,
    contextualNoteBridge
  }

    

  function proxyInjectionPrototype(functionIndex: any, functionNames = Object.keys(functionIndex)) {

    for (let name of functionNames) {
      idToFunctionNameIndex[functionNameToIdIndex[name] = currentId++] = name
      let defaultFunc = functionIndex[name]
      let directCall = true
      let me = false
      let ret: any
      let isReturn: boolean
      let r: any
      functionIndex[name] = function(...args: any) {
        if (this[historyBridge] !== undefined && directCall) {
          directCall = false
          me = true
        }

        ret = defaultFunc.apply(this, args)
        isReturn = ret instanceof Return
        r = isReturn ? ret.ret : ret

        if (me) {
          me = false
          directCall = true
          
          if (isReturn) {
            args.add(ret.historyNote)
            r[contextualNoteBridge] = ret.contextualNote
          }
          this[historyBridge](now())(functionNameToIdIndex[name]).add(args)
        }

        
        return r
      }
    }

    return functionIndex
  }
}


export interface HistoryIndexAbstract<Value> extends Data<Value> {
  apply(o: {timeStamp: number, id: number, args: any[], force?: boolean}): void
}

function classLsToFunctionIndex(...clsLs: any[]): any {
  let o = {}
  clsLs.ea((cl) => {
    let functionNames = Object.getOwnPropertyNames(cl).rmV("constructor")
    for (let fnName of functionNames) {
      o[fnName] = cl.prototype[fnName]
    }
  })
  return o
}


type MergedDataDerivative<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]> = { new<Q> (a: Q): { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] extends never ? Data<Q> : { [key in keyof T]: InstanceType<T[key]> extends Data<Q> ? InstanceType<T[key]> : never }[number] }
export function setDataDerivativeIndex<T extends DataDerivativeCollectionClasses<W>, W extends unknown[]>(...classLs: T): MergedDataDerivative<T, W> & { proxy: (...settings: any[]) => (MergedDataDerivative<T, W> & { HistoryIndex: { new<Value>(data: Data<Value>): HistoryIndexAbstract<Value> }, contextualIndexing: (...a: any[]) => (MergedDataDerivative<T, W> & { HistoryIndex: { new<Value>(data: Data<Value>): HistoryIndexAbstract<Value> } })})}  {

  
  const functionIndex = classLsToFunctionIndex(classLs)
  const attachToData = (() => {
    const a = constructAttatchToPrototype(dataDerivativeLiableIndex.Inner("prototype"))
    return function attachToData() {
      for (let functionName in functionIndex) {
        a(functionName, functionIndex[functionName])
      }
    }
  })()

  attachToData()
  

  let end: any = Object.getPrototypeOf(classLs.first)
  end.proxy = (...undoClsLs: any[]) => {
    const { proxyInjectionPrototype, idToFunctionNameIndex, historyBridge, contextualNoteBridge } = constructProxyInjectionPrototype()
    let undoFunctionIndex = classLsToFunctionIndex(...undoClsLs)
    let undoFunctionNames = Object.keys(undoFunctionIndex)
    proxyInjectionPrototype(functionIndex, undoFunctionNames)
    attachToData()

    let contextualIndexFunctionIndex: any

    class HistoryIndex<Value = unknown> extends Data<Value> implements HistoryIndexAbstract<Value> {
      private link: DataSubscription<[Value]>
      private historyIndex = constructObjectIndex((timeStamp: number) => constructObjectIndex((functionId: number) => {return [] as Args[]}))
    
      constructor(private data: Data<Value>) {
        super(data.get())
        this.link = data.get(super.set.bind(this), false)
    
        this[historyBridge] = this.historyIndex
      }


      public apply({timeStamp, id, args, force}: {timeStamp: number, id: number, args: any[], force?: boolean}) {
        this.link.deactivate()
        let thisProxyFunctionName = idToFunctionNameIndex[id]
        let localArgsIndex = this.historyIndex(timeStamp)(id)
        let currentHistoryIndex = this.historyIndex()

        if (+Object.keys(currentHistoryIndex).last === timeStamp) {
          currentHistoryIndex[timeStamp][id].add(args)
          this.data[thisProxyFunctionName](args)
          this.value = this.data.get()
        }
        else if (!localArgsIndex.empty && !force) throw new LocalHistoryInconsistencyWithServer()
        else {
          
          let morphData = new Data(this.get())

          let timeStamps = Object.keys(currentHistoryIndex)
          let givenTimeStampIndex: number
          for (let i = timeStamps.length - 1; i >= 0; i--) {
            if (timeStamp >= +timeStamps[i]) {
              givenTimeStampIndex = i + 1
              break
            }
            let functionIndex = currentHistoryIndex[timeStamps[i]]
            for (let id in functionIndex) {
              let args = functionIndex[id] as any[][]

              undoFunctionIndex[idToFunctionNameIndex[id]].apply(morphData, args)
            }
          }

          let contextualNote: any

          if (force) {
            // There cannot be two changes at the same index!
            currentHistoryIndex[timeStamp][id] = args
            contextualNote = []
            for (let arg of args) {
              contextualNote.add(morphData[thisProxyFunctionName](arg)[contextualNoteBridge])
            }
          }
          else {
            currentHistoryIndex[timeStamp][id].add(args)
            contextualNote = morphData[thisProxyFunctionName](args)[contextualNoteBridge]
          }

          
          
          
          

          for (let i = givenTimeStampIndex; i < timeStamps.length; i++) {
            let functionIndex = currentHistoryIndex[timeStamps[i]]
            for (let id in functionIndex) {
              let args = functionIndex[id] as any[][]
              let fnName = idToFunctionNameIndex[id]
              morphData[fnName](...(contextualIndexFunctionIndex ? contextualIndexFunctionIndex[fnName].apply(morphData, args) : args))
            }
          }
          
          this.value = this.data.set(morphData.get())
        }

        this.link.activate()
      }
    
      public set(value: Value): Value {
        return this.value = this.data.set(value)
      }
    }
    

    end.HistoryIndex = HistoryIndex
    delete end.proxy
    end.contextualIndexing = (...clsLs: any[]) => {
      contextualIndexFunctionIndex = classLsToFunctionIndex(...clsLs)
    }
    return end
  }
  return end
}



export class Return<Ret> {
  constructor(public ret?: Ret, public historyNote?: any, public contextualNote?: any) {}
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
