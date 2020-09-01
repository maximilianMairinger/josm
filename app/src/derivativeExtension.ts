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
  let historyIndexBridge = Symbol("history")
  let idToFunctionNameIndex: {[id in number]: string} = {0: "set"}
  let functionNameToIdIndex: {[functionName in string]: number} = {set: 0}
  let currentId = 1

  let currentContextual = {
    note: undefined
  }
  let currentHistory = {
    note: undefined
  }

  return {
    historyIndexBridge,
    idToFunctionNameIndex,
    functionNameToIdIndex,
    proxyInjectionPrototype,
    currentContextual,
    currentHistory
  }

    

  function proxyInjectionPrototype(functionIndex: any, functionNames = Object.keys(functionIndex)) {
    let directCall = true
    let me = false

    let ret: any
    let r: any

    for (let name of functionNames) {
      idToFunctionNameIndex[functionNameToIdIndex[name] = currentId++] = name
      let defaultFunc = functionIndex[name]

      functionIndex[name] = function(...args: any) {
        if (this[historyIndexBridge] !== undefined && directCall) {
          directCall = false
          me = true
        }

        ret = defaultFunc.apply(this, args)
        if (ret instanceof Return) {
          if (ret.historyNote) args = ret.historyNote
          currentHistory.note = args
          currentContextual.note = ret.contextualNote
          ret = ret.ret
        }

        

        if (me) {
          me = false
          directCall = true

          if (args && !args.empty) this[historyIndexBridge](now())(functionNameToIdIndex[name]).add(args)
        }

        
        return ret
      }
    }

    return functionIndex
  }
}


export interface HistoryIndexAbstract<Value> extends Data<Value> {
  apply(o: {timeStamp: number, id: number | string, args: any[], force?: boolean}): void
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
    const { proxyInjectionPrototype, idToFunctionNameIndex, historyIndexBridge, functionNameToIdIndex, currentContextual, currentHistory } = constructProxyInjectionPrototype()
    let undoFunctionIndex = classLsToFunctionIndex(undoClsLs)
    let undoFunctionNames = Object.keys(undoFunctionIndex)
    proxyInjectionPrototype(functionIndex, undoFunctionNames)
    attachToData()

    let contextualIndexFunctionIndex: any = {}

    class HistoryIndex<Value = unknown> extends Data<Value> implements HistoryIndexAbstract<Value> {
      private link: DataSubscription<[Value]>
      private historyIndex = constructObjectIndex((timeStamp: number) => constructObjectIndex((functionId: number) => {return [] as Args[]}))
    
      constructor(private data: Data<Value>) {
        super(data.get())
        this.link = data.get(super.set.bind(this), false)
    
        data[historyIndexBridge] = this.historyIndex
        this.historyIndex(now())(functionNameToIdIndex.set).add([data.get()])
      }


      public apply({timeStamp, id, args, force}: {timeStamp: number, id: number, args: any[], force?: boolean}) {
        this.link.deactivate()
        id = typeof id === "string" ? functionNameToIdIndex[id] : id
        let thisProxyFunctionName = idToFunctionNameIndex[id]
        let currentHistoryIndex = this.historyIndex()

        if (+Object.keys(currentHistoryIndex).last === timeStamp) {
          this.data[thisProxyFunctionName](...args)
          this.value = this.data.get()
        }
        else if ((currentHistoryIndex[timeStamp] && currentHistoryIndex[timeStamp][id] && !currentHistoryIndex[timeStamp][id].empty) && !force) throw new LocalHistoryInconsistencyWithServer()
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

              for (let arg of args) {
                undoFunctionIndex[idToFunctionNameIndex[id]].apply(morphData, arg)
              }
            }
          }

          let contextualNote: any



          if (force) {
            // There cannot be two changes at the same index!
            contextualNote = []
            let historyArgs = currentHistoryIndex[timeStamp][id] = []
            for (let arg of args) {
              
              morphData[thisProxyFunctionName](...arg)
              contextualNote.add(currentContextual.note)
              historyArgs.add(currentHistory.note)
            }
          }
          else {
            morphData[thisProxyFunctionName](...args)
            contextualNote = currentContextual.note
            if (currentHistory.note && !currentHistory.note.empty) this.historyIndex(timeStamp)(id).add(currentHistory.note)
          }

          
          
          
          
          for (let i = givenTimeStampIndex; i < timeStamps.length; i++) {
            let functionIndex = currentHistoryIndex[timeStamps[i]]
            for (let id in functionIndex) {
              let args = functionIndex[id] as any[][]
              let fnName = idToFunctionNameIndex[id]

              for (let arg of args) {
                if (contextualIndexFunctionIndex[fnName]) arg.set(contextualIndexFunctionIndex[fnName](arg, contextualNote))
                morphData[fnName](...arg)
              }
              
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
    end.contextualIndexing = (_contextualIndexFunctionIndex: any) => {
      contextualIndexFunctionIndex = _contextualIndexFunctionIndex
      delete end.contextualIndexing
      return end
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
