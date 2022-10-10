import { Data, DataSubscription, DataBaseSubscription, Subscription, DataSet, dataSubscriptionCbBridge, Subscribable, localSubscriptionNamespace, needFallbackForSubs, registerSubscriptionNamespace, subscriptionDiffSymbol, instanceTypeSym, instanceTypeLink, futurePromiseSym, whitelistFuncFlag } from "./data"
import { DataCollection } from "./dataCollection"
import { nthIndex } from "./helper"
import { constructAttatchToPrototype } from "attatch-to-prototype"
import { dbDerivativeCollectionIndex } from "./derivativeExtension"
import diff from "fast-object-diff"
import { MultiMap } from "./lib/multiMap"
import { cloneKeys, cloneKeysButKeepSym } from "./lib/clone"
import { SyncProm } from "./lib/syncProm"




import xtring from "xtring"
xtring()
import xrray from "xrray"
xrray(Array)

import { tunnelSubscription, justInheritanceFlag, internalDataBaseBridge } from "./data"
import LinkedList, { Token } from "fast-linked-list"
import copy from "fast-copy"
import keyIndex from "key-index"
import ResablePromise, { wrapPromiseLike } from "./lib/resAblePromise"


export const parsingId = Symbol("parsingId")


interface Link {
  destroy(): void
  resolvePath(): void
  destroyPathSubscriptions(): void
  dataChange(wrapper: DataBase<any>): void
  updatePathResolvent(wrapper?: DataBase<any>): void
} 


function justifyNesting(obj: any) {
  let just = false;
  const deeper = [] as any[];
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === "object") deeper.push({ key, val });
    else just = true;
  }

  for (const { key, val } of deeper) {
    if (justifyNesting(val)) just = true;
    else delete obj[key];
  }
  return just;
}



const rmSymWhereNew = (sym: any) => {
  let knownOg: Set<object>
  return function rmSymWhereNew(diff: object, og: object = {}) {
    knownOg = new Set()
    const ob = cloneKeysButKeepSym(diff)
    rmSymWhereNewRec(ob, og)
    return ob
  }
  
  function rmSymWhereNewRec(diff: object, og: object = {}) {
    knownOg.add(og[sym])
    if (!knownOg.has(diff[sym])) delete diff[sym]
    else return
    for (const key in diff) {
      if (typeof diff[key] === "object") {
        rmSymWhereNewRec(diff[key], og[key])
      }
    }
  }
}

const rmParsingIdWhereNew = rmSymWhereNew(parsingId)


const unduplifyNestedObjectPath = (() => {
  let known: Set<Object>

  return function unduplifyNestedObjectPath(root: any) {
    known = new Set()
    known.add(root);
    unduplify(root);
  }

  function unduplify(obj: any) {
    const deeper = [] as any[];
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === "object") {
        if (!known.has(val)) {
          known.add(val);
          deeper.push(val);
        } else {
          delete obj[key];
        }
      }
    }
    for (const deep of deeper) unduplify(deep);
  }
})()






function sanatizeDiff(diff: object) {
  const copiedDiff = copy(diff)
  unduplifyNestedObjectPath(copiedDiff)
  justifyNesting(copiedDiff)
  return copiedDiff
}

function forwardLink(target: any, forwards: string[], instancePath?: string): void
function forwardLink(target: any, source: any, instancePath?: string): void
function forwardLink(target: any, source_forwards: any | string[], instancePath: string = "_data") {
  let tarProto = target.prototype
  let forwards: string[]
  if (source_forwards instanceof Array) forwards = source_forwards
  else {
    let src = Object.getOwnPropertyNames(source_forwards.prototype)
    src.splice(src.indexOf("constructor"), 1)
    let tar = Object.getOwnPropertyNames(tarProto)
    tar.splice(tar.indexOf("constructor"), 1)
    forwards = []
    for (let k of src) {
      if (!tar.includes(k)) forwards.push(k)
    }
  }
  
  const attach = constructAttatchToPrototype(tarProto)
  for (let functionName of forwards) {
    attach(functionName, function (...a) {
      return this[instancePath][functionName](...a)
    })
  }
}


function isObjectEmpty(ob: any) {
  return Object.keys(ob).length === 0
}

//@ts-ignore
export class DataLink extends Data implements Link {
  private pathSubscriptions: DataSubscription<PathSegment[]>[] | PrimitivePathSegment[] = []
  private wrapper: DataBase<any>
  private _data: Data<any>
  private subs: LinkedList<DataSubscription<any>> = new LinkedList()

  private currentPathIndex: PrimitivePathSegment[]

  constructor(wrapper: DataBase<any>, private paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]) {
    super(justInheritanceFlag)
    this.dataChange(wrapper)
  }
  protected destroy() {
    this.destroyPathSubscriptions()

    for (const sub of this.subs) sub.deactivate()
    this.subs.clear()

    for (let key in this) {
      delete this[key]
    }
  }

  tunnel(func: Function): any {
    let d = this._data.tunnel(func as any)
    const tok = this.subs.push(d[tunnelSubscription])
    d[tunnelSubscription][dataLinkTokTunnel] = tok
    return d
  }

  
  get(cb?: Function | DataSubscription<any>, init?: boolean) {
    if (cb) {
      let sub = this._data.get(cb as any, init)
      this.subs.push(sub)
      return sub
    }
    else return this._data.get()
  }

  public valueOf() {
    return this._data.valueOf()
  }


  set(...a: any) {
    //@ts-ignore
    return this._data.set(...a)
  }

  got(...a: any) {
    //@ts-ignore
    let sub = this._data.got(...a)
    sub[dataLinkTokTunnel].remove()
    return sub
  }


  updatePathResolvent(wrapper: DataBase<any> = this.wrapper) {
    let parent = this.wrapper = wrapper as any
    this.currentPathIndex.ea((path) => {
      parent = parent[path as PrimitivePathSegment]
    })

    //@ts-ignore
    if (this._data) this._data.linksOfMe.splice(this._data.linksOfMe.indexOf(this), 1)

    if (this._data !== parent) {
      this._data = parent
      this._data[instanceTypeSym] = "Data"
      //@ts-ignore
      this._data.linksOfMe.push(this)
      for (const sub of this.subs) sub.data(parent, true)
    }
  }
  destroyPathSubscriptions() {}
  resolvePath() {}
  dataChange(wrapper?: DataBase<any>) {
    this.wrapper = wrapper as any
  
    this.resolvePath()
  }
}

forwardLink(DataLink, Data)


const dataLinkTokTunnel = Symbol("dataLinkSubTunnel")
const internalDataBaseLinkBridge = Symbol("internalDataBaseLinkBridge")
const customForwards = new Set(["get"])

class DataBaseLink extends Function implements Link {
  private dataBaseFunc: DataBase<any>
  private dataBase: InternalDataBase<any>
  // needed registration api
  private _data: InternalDataBase<any>
  private funcThis: any
  private wrapper: DataBase<any>
  private paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]
  private currentPathIndex: (string  | number)[]

  private distributedLinks: Link[]
  private subscriptions: DataSubscription<any>[]

  private pathSubscriptions: DataSubscription<PathSegment[]>[]

  

  private distributedPathIndex = keyIndex((key: string) => {
    let linkInstance: any
    let link: any
    if (this.dataBaseFunc[key] instanceof Data) linkInstance = link = new DataLink(this.dataBaseFunc as any, [key])
    else linkInstance = (link = new DataBaseLink(this.dataBaseFunc as any, [key]))[internalDataBaseLinkBridge]
    // let des = linkInstance.destroy.bind(linkInstance)
    // linkInstance.destroy = () => {
    //   des()
    //   delete this.funcThis[key]
    // }
    // localSubscriptionNamespace.register(linkInstance)
    this.distributedLinks.push(linkInstance)
    return link
  })

  

  constructor(wrapper: DataBase<any>, paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]) {
    super(paramsOfDataBaseLinkFunction, bodyOfDataBaseLinkFunction)
    
    this.funcThis = new Proxy(this.bind(this), {
      get: (target, key) => {
        if (key === "then") return undefined
        if (internalDataBaseLinkBridge === key) return this
        const funcVal = this.dataBaseFunc[key]
        return typeof key === "string" ? customForwards.has(key) ? this[key] : funcVal !== undefined ? funcVal[whitelistFuncFlag] ? funcVal : this.distributedPathIndex(key as any) : undefined : this[key]
      }
    })

    this.paths = paths
    this.pathSubscriptions = []
    this.distributedLinks = []
    this.subscriptions = []
    
    this.dataChange(wrapper)
    

    const attach = constructAttatchToPrototype(this.funcThis, {enumerable: false})
    const { index } = dbDerivativeCollectionIndex
    for (let key in index) {
      attach(key, index[key])  
    }

    return this.funcThis
  }

  destroy() {
    // this is only getting called from InternalDataBase.
    // Todo: are the subscriptions here properly dispached? Like in DataLink.

    this.funcThis(undefined)

    this.destroyPathSubscriptions()

    this.distributedLinks.clear()
    
    for (let iterator in this) {
      delete this[iterator]
    }
    
    
  }

  destroyPathSubscriptions() {}
  resolvePath() {}
  updatePathResolvent(wrapper: DataBase<any> = this.wrapper) {
    if (this.dataBase) this.dataBase.linksOfMe.rmV(this)

    let parent = this.wrapper = wrapper as any
    this.currentPathIndex.ea((path) => {
      parent = parent[path as any]
    })

    if (this.dataBaseFunc !== parent) {
      this.dataBaseFunc = parent
      //@ts-ignore
      this[internalDataBaseBridge] = this._data = this.dataBase = this.dataBaseFunc[internalDataBaseBridge]
      if (this.dataBase[instanceTypeSym] === undefined) this.dataBase[instanceTypeSym] = this[instanceTypeSym]


      this.dataBase.linksOfMe.push(this)
      //@ts-ignore
      for (const e of this.subscriptions) e.data(this.dataBase, true)
      for (const e of this.distributedLinks) e.dataChange(this.dataBaseFunc)
    }
  }


  dataChange(wrapper: DataBase<any>) {
    this.wrapper = wrapper
    this.resolvePath()
    
  }


  // TODO: get set sub unsub usw

  public toString() {
    return this.dataBase.toString()
  }


  LinkFunctionWrapper(...a) {
    return this.LinkFunction(...a)
  }

  LinkFunction(...a) {
    this[instanceTypeSym] = "DataBase"

    if (typeof a[0] === "function" || a[0] instanceof DataSubscription) {
      //@ts-ignore
      let sub = this.dataBaseFunc(...a)
      //@ts-ignore
      this.subscriptions.push(sub)
      return sub
    }
    else if (a[0] instanceof Data || a[0] instanceof DataCollection || typeof a[0] === "string" || typeof a[0] === "number") {
      //@ts-ignore
      let link = this.dataBaseFunc(...a)
      //@ts-ignore
      this.distributedLinks.push(link)
      // TODO: on remove 
      return link
    }
    //@ts-ignore
    else return this.dataBaseFunc(...a)
  }

  get(subs, init) {
    const t = this[internalDataBaseLinkBridge]
    t.lel = t[instanceTypeSym] = "Data"
    const sub = t._data.get(subs, init)
    t.subscriptions.push(sub as any)
    return sub
  }



  // TODO
}



const attachToLinks = constructAttatchToPrototype([DataBaseLink, DataLink].map(e => e.prototype))



attachToLinks("resolvePath", function() {

  this.currentPathIndex = []

  let top = 0

  for (let i = 0; i < this.paths.length; i++) {
    const path = this.paths[i];
    const localTop = top
    
    if (path instanceof Data) {
      this.pathSubscriptions.push(path.get((e) => {
        this.currentPathIndex[localTop] = e
        this.updatePathResolvent()
      }, false))
      this.currentPathIndex[top] = path.get()
      top++
    }
    else if (typeof path === "string" || typeof path === "number") {
      this.currentPathIndex[top] = path
      top++
    }
    else {
      

      this.pathSubscriptions.push(path.get((...e) => {
        let maTop = localTop
        e.ea((e) => {
          this.currentPathIndex[maTop] = e
          maTop++
        })
        this.updatePathResolvement()
      }, false))

      path.get().ea((e) => {
        this.currentPathIndex[top] = e
        top++
      })
    }
  }



  

  this.updatePathResolvent()
});

// clone every object that doesnt have parsingId already defined
const cloneUntilParsingId = (() => {
  let known: Map<any, any>
  return function cloneUntilParsingId(ob: object) {
    known = new Map()
    return cloneUntilParsingIdRec(ob)
  }
  
  function cloneUntilParsingIdRec(ob: object) {
    if (known.has(ob)) return known.get(ob)
    let obClone = {}
    known.set(ob, obClone)
    if (ob[parsingId] === undefined) {
      for (let key in ob) {
        if (ob[key] instanceof Object) obClone[key] = cloneUntilParsingIdRec(ob[key])
        else obClone[key] = ob[key]
      }
    }
    else obClone = ob
    return obClone
  }
})()



type DataSetify<E extends any[]> = {
  //@ts-ignore
  [key in keyof E]: DataCollection<E[key]> | Data<E[key]> | (E[key] extends PrimitivePathSegment ? E[key] : never)
}


type Unshift<A, T extends Array<any>> 
= ((a: A, ...b: T) => any) extends ((...result: infer Result) => any) ? Result : never;
type Shift<T extends Array<any>> 
= ((...a: T) => any) extends ((a: any, ...result: infer Result) => any) ? Result : never;

type Revert
  <T extends Array<any>
  , Result extends Array<any> = []
  , First extends T[keyof T] = T[0]
  , Rest extends Array<any> = Shift<T>> = {
  [K in keyof T]: Rest['length'] extends 0 ? Unshift<First, Result> : Revert<Rest, Unshift<First, Result>> 
}[0]

// this was done to avoid infinite processing the type by TS
type Level = 0 | 1 | 2 | 3 | 4 | 5
type NextLevel<X extends Level> = 
  X extends 0
  ? 1
  : X extends 1
  ? 2
  : X extends 2
  ? 3
  : X extends 3
  ? 4
  : X extends 4
  ? 5
  : never

// this type will give us possible path type for the object
type RecursivePath<Obj extends object, Result extends any[] = [], Lv extends Level = 0> = {
  [K in keyof Obj]: 
    Lv extends never
    ? Result
    : Obj[K] extends object 
    ? (Result['length'] extends 0 ? never : Revert<Result>) | RecursivePath<Obj[K], Unshift<K, Result>, NextLevel<Lv>>
    : Revert<Result> | Revert<Unshift<K,Result>>
}[keyof Obj]


// this type will give as value type at given path
// type RecursivePathPluck<Obj, Path extends any> = 
// {
//   [K in keyof Path]: 
//     Path extends any[]
//     ? Path[K] extends keyof Obj 
//     ? Path['length'] extends 1 
//     ? Obj[Path[K]]
//     : RecursivePathPluck<Obj[Path[K]], Shift<Path>>
//     : never
//     : never
// }[number]

// // checks if type is working
// type Test3 = RecursivePathPluck<{a: {b: {c: string}, d: string}},['a', 'b']>
// type Test4 = RecursivePathPluck<{a: {b: {c: {e: string}}, d: [string, number]}}, ['a','d', 0]>

type MaybeDataBase<Type> = Type extends object ? DataBase<Type> : Data<Type>

// type RecursivePathPluckDatabase<Obj, Path> = MaybeDataBase<RecursivePathPluck<Obj, Path>>


// type Test5 = RecursivePathPluckDatabase<{a: 2, b: {qwe: "qwe"}}, ["b"]>

// let e: Test5
// e.qwe

// When infering undefined as generic it gets converted to any (instead of staying undefined). So here is the quickfix, which 
// detects any or undefined types as "undefined". Note: that this leaves out the case where you are infering from null
type IsAny<Any> = (Any extends never ? true : false) extends false ? false : true
type IsItUndefinedOrAny<T> = T extends undefined ? true : IsAny<T>


type DefinedKeyVal<V, K> = IsItUndefinedOrAny<V> extends true ? never : K
type UndefinedKeyVal<V, K> = IsItUndefinedOrAny<V> extends false ? never : K

type FilterForDefinedField<T> = { [P in keyof T]: DefinedKeyVal<T[P], P> };
type FilterForUndefinedField<T> = { [P in keyof T]: UndefinedKeyVal<T[P], P> };

type DefinedFieldUnion<T> = FilterForDefinedField<T>[keyof FilterForDefinedField<T>]
type UndefinedFieldUnion<T> = FilterForUndefinedField<T>[keyof FilterForUndefinedField<T>]


type Merge<A, B> = {[key in keyof A | keyof B]: (key extends keyof A ? A[key] : never) | (key extends keyof B ? B[key] : never)};

type S = {key2: undefined, key4: 44}

type e = DataBase<FilterT<S, DefinedFieldUnion<S>>>
// let e: e

type FilterT<T extends {[key in string | number | symbol]: any}, Filter extends string | number | symbol, ProperFilter extends DefinedFieldUnion<{[key in Filter]: key extends keyof T ? T[key] : undefined}> = DefinedFieldUnion<{[key in Filter]: key extends keyof T ? T[key] : undefined}>> = { [K in ProperFilter]: T[K] extends {[key in string | number | symbol]: any} ? FilterT<T[K], Filter> : T[K] }
type f = FilterT<{q: number}, "q" | "w">

type Filter = "q" | "w"
type T = {q: number}
type qq = DefinedFieldUnion<{[key in Filter]: key extends keyof T ? T[key] : undefined}>

type test = DataBase<FilterT<S, DefinedFieldUnion<S>>>
// let t: test



type q = Exclude<{e: number, q: string}, "q">
// type q = never | 2

// type e = NoUndefinedField<{
//   e: string,
//   q: never,
//   w: number,
//   n: {
//     w: number,
//     e: string,
//     ww: undefined,
//     www: undefined
//   }
// }>

//@ts-ignore
const entireDataBaseLinkFunction = DataBaseLink.prototype.LinkFunctionWrapper.toString(); 
const paramsOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("(") + 1, nthIndex(entireDataBaseLinkFunction, ")", 1));
const bodyOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("{") + 1, entireDataBaseLinkFunction.lastIndexOf("}"));



type QueryForStore<Store extends object> = {
  [K in keyof Store]?: Store[K] extends object ? (boolean | QueryForStore<Store[K]>) : boolean
}


function futureMainFunc(...params: any[]) {
  const p = params[0]
  if (typeof p === "string" || typeof p === "number" || p instanceof Data || p instanceof DataCollection) {
    let myDB: any
    if (this.preCreatedData) myDB = this.preCreatedData
    else {
      myDB = this.preCreatedData = new InternalDataBase<object>(this.queryFunc, undefined, this.notifyParentOfChange)[internalDataBaseBridge]
      myDB.linksOfMe = this.linksOfMe
      this.parent.store[this.fromKey] = myDB.store
      this[futurePromiseSym].res(myDB)
    }
    myDB.queryForGet = this.parent.queryForGet
    myDB.midQueryForGet = this.parent.midQueryForGet



    return myDB.funcThis(...params)
  }
  else if (typeof p === objectString) {
    this.resolving = true
    let myDB: any
    if (this.preCreatedData) myDB = this.preCreatedData
    else {
      if (!this.parent.queryForGet) {
        myDB = this.preCreatedData = new InternalDataBase<object>(p, undefined, this.notifyParentOfChange)[internalDataBaseBridge]
        myDB.linksOfMe = this.linksOfMe
        this[futurePromiseSym].res(myDB)
        return
      }
      myDB = new InternalDataBase<object>(this.queryFunc, undefined, this.notifyParentOfChange)[internalDataBaseBridge]
      myDB.linksOfMe = this.linksOfMe
      this.parent.store[this.fromKey] = myDB.store
    }
    myDB.queryForGet = this.parent.queryForGet
    myDB.midQueryForGet = this.parent.midQueryForGet
    
    
    myDB.funcThis(p)

    this[futurePromiseSym].res(myDB)
  }
  else { // func or get
    let myDB: any
    if (this.preCreatedData) myDB = this.preCreatedData
    else {
      myDB = this.preCreatedData = new InternalDataBase<object>(this.queryFunc, undefined, this.notifyParentOfChange)[internalDataBaseBridge]
      myDB.linksOfMe = this.linksOfMe
      this.parent.store[this.fromKey] = myDB.store
      this[futurePromiseSym].res(myDB)
    }
    myDB.queryForGet = this.parent.queryForGet
    myDB.midQueryForGet = this.parent.midQueryForGet


    if (p instanceof Function) return myDB.funcThis(p, params[1], params[2] === undefined ? false : params[2])
    else return myDB.funcThis(...params)
  }
  // else {
  //   return wrapPromiseLike(this[futurePromiseSym].then((el) => {
  //     return el.funcThis(...params)
  //   }))
  // }
}


const { params: futureFuncParams, body: futureFuncBody } = functionToStr(futureMainFunc)

import { DataFuture } from "./data"
const _explicitlyForwardToThis = Object.getOwnPropertyNames(DataFuture.prototype)
_explicitlyForwardToThis.shift() // pop constructor
const explicitlyForwardToThis = new Set(_explicitlyForwardToThis)
explicitlyForwardToThis.add("then")
class Future extends DataFuture {
  protected prox: any
  
  private store = new Proxy({}, {
    set: (target, key, value) => {
      this.prox({[key]: value})
      return true
    }
  })
  public props = {} as any

  linksOfMe = []

  constructor(queryFunc: Function, private notifyParentOfChange: any, private parent: DataBase<object>, private fromKey: any) {
    super(queryFunc, futureFuncParams, futureFuncBody)
    
    
        
    const prox = this.prox = new Proxy(this.bind(this), {
      get: (target, key) => {
        // when resing a promise with this as a value, the promise tries to call then. 
        // And Proxy tries to resolve this parameter get if this is not defined as undefined here
        if (key === "then") return undefined // for for promise
        if (this[futurePromiseSym].settled) return this[futurePromiseSym].value.pFuncThis[key]

        if (typeof key === "symbol") return this[key]
        if (key in this.props) return this.props[key]
        if (explicitlyForwardToThis.has(key)) return this[key]
        
        
        return this.prox(key)
      }
    }) as any;
    (queryFunc as any).fut = this
    return prox
  }

}





export class InternalDataBase<Store extends ComplexData, _Default extends Store = Store> extends Function {
  private funcThis: any

  private store: Store
  private notifyParentOfChangeCbs: any[]
  private beforeDestroyCbs: MultiMap<InternalDataBase<any>, Function>

  public linksOfMe: Link[]

  private subscriptionsOfChildChanges: LinkedList<DataSubscription<[Readonly<Store>]>>
  private subscriptionsOfThisChanges: LinkedList<DataSubscription<[Readonly<Store>]>>

  private callMeWithDiff: (key: string) => ((diff: any, origins: Set<any>) => (() => void))
  private callMeWithDiffIndex: Map<string, ((diff: any, origins: Set<any>) => (() => void))> & { activate(): void, deactivate(): void }

  private locSubNsReg: any[]
  private isRoot: boolean


  private hasQueryFunc: boolean
  constructor(store?: Store | ((query: QueryForStore<Store>) => (RecursivePartial<Store> | Promise<RecursivePartial<Store>>)), private _default: _Default = {} as any, notifyParentOfChange?: (diff: any, origins: Set<any>) => (() => void)) {
    super(paramsOfDataBaseFunction, bodyOfDataBaseFunction)
    localSubscriptionNamespace.dont(this)
    const myFuncThis = this.funcThis = this.bind(this)

    this.setToFuncThis = constructAttatchToPrototype(myFuncThis, {enumerable: true})

    this.linksOfMe = []
    this.locSubNsReg = []
    this.notifyParentOfChangeCbs = []
    this.subscriptionsOfChildChanges = new LinkedList()
    this.subscriptionsOfThisChanges = new LinkedList()
    this.beforeDestroyCbs = new MultiMap

    this.callMeWithDiffIndex = new Map as any
    this.callMeWithDiff = (key: string) => {
      let f = this.callMeWithDiffIndex.get(key)
      if (f !== undefined) {
        this.funcThis[key][internalDataBaseBridge].removeNotifyParentOfChangeCb(f)
        this.callMeWithDiffIndex.delete(key)
      }
      else {
        f = (diff: any, origins: Set<any>) => {
          return this.aggregateCall(undefined, {diff: {[key]: diff}, origins}, false)
        }
        f.flush = () => {
          return this.flushCall(false)
        }
        this.callMeWithDiffIndex.set(key, f)
      }
      
      return f
    }
    this.funcThis[internalDataBaseBridge] = this

    this.hasQueryFunc = store instanceof Function
    this.initFuncProps(this.hasQueryFunc ? {} : store as any, _default)

    if (notifyParentOfChange) {
      this.isRoot = false
      this.addNotifyParentOfChangeCb(notifyParentOfChange)
    }
    else {
      this.isRoot = true
    }

    
    
    

    const { index } = dbDerivativeCollectionIndex
    for (let key in index) {
      this.setToFuncThis(key, {value: index[key], enumerable: false})  
    }

    if (this.hasQueryFunc) {
      // when resing a promise with this as a value, the promise tries to call then. And Proxy tries to resolve this parameter get if this is not defined as undefined here
      const queryFunc = this.queryFunc = store as Function & {fut?: any}
      
      const myProxy = this.myProx = new Proxy(myFuncThis, {
        get: (target, key) => {
          if (key === "then") return undefined
          if (typeof key === "symbol" || (!this.queryForGet && !this.midQueryForGet)) return target[key]
          if (key in target) return target[key]

          const f = new Future(async (query) => (await queryFunc({[key]: query}))[key], this.callMeWithDiff(key), this as any, key);

          
          myFuncThis[key] = f
          f[futurePromiseSym].then((r) => {
            myFuncThis[key] = r instanceof Data ? r : r.funcThis
          })
          return f
        }
      })
      this.futFuncThis = queryFunc.fut !== undefined ? queryFunc.fut : this.funcThis
      this.pFuncThis = myProxy
      return myProxy
    }
    else {
      this.pFuncThis = this.funcThis
      return myFuncThis
    }
  }

  private setToFuncThis: (key: string | number, val: any) => void

  private queryFunc: any
  private pFuncThis: any
  private futFuncThis: any
  private myProx: any


  addNotifyParentOfChangeCb(...cb: ((diff: any, origins: Set<any>) => (() => void))[]) {
    this.notifyParentOfChangeCbs.push(...cb)
  }
  removeNotifyParentOfChangeCb(...cb: ((diff: any, origins: Set<any>) => (() => void))[]) {
    this.notifyParentOfChangeCbs.rmV(...cb)
  }

  private addBeforeDestroyCb(from: InternalDataBase<any>, cb: () => void) {
    this.beforeDestroyCbs.set(from, cb)
  }

  destroy(from: InternalDataBase<any>, key?: string) {
    this.inBulkChange = true
    const myBeforeDestroyCbs = this.beforeDestroyCbs.get(from)
    if (key === undefined || myBeforeDestroyCbs.length === 1) {
      myBeforeDestroyCbs.forEach(f => f())
      this.beforeDestroyCbs.delete(from)
    }
    else {
      for (let i = 0; i < myBeforeDestroyCbs.length; i++) {
        // This is suboptimal, as it is not indexed thus having a timecomplexity of O(n).
        // But this will probably never manifest itself, as having multiple keys (on one db) pointing to the same db object 
        // is not really usefull at all. Just for testing maybe, so thats why this is handled here.
        if ((myBeforeDestroyCbs[i] as any).key === key) {
          myBeforeDestroyCbs.splice(i, 1)
          break
        }
        
      }
    }

    if (!this.isRoot && this.beforeDestroyCbs.size === 0) {
      delete this.store[parsingId as any]

      
      for (const key in this.funcThis) {
        if (this.funcThis[key] instanceof Data) {
          this.funcThis[key].destroy(this)
        }
        else {
          this.funcThis[key][internalDataBaseBridge].destroy(this)  
        }
        // delete this.funcThis[key] 
        // this is done in the respective del funcs
      }

      registerSubscriptionNamespace(() => {
        const subs = this.subscriptionsOfThisChanges as any as Function[]
        for (const sub of subs) {
          if (sub.length === 2) (sub as any)(undefined, undefined)
          else (sub as any)(undefined, undefined, undefined)
        }
      }, this.locSubNsReg)

      
      this.notifyParentOfChangeCbs.clear()
      
      for (const e of this.linksOfMe) e.destroy()
      this.linksOfMe.clear()
      for (const e of this.locSubNsReg) e.destroy()
      this.locSubNsReg.clear()
  
      // for (const key in this) {
      //   //@ts-ignore
      //   delete this[key]
      // }
      // dont think this is necessary for GC
      return true
    }
    else {
      this.inBulkChange = false
      return false
    }
  }

  private DataBaseFunctionWrapper(...a) {
    //@ts-ignore
    return this.DataBaseFunction(...a)
  }



  private inBulkChange: boolean
  
  
  protected DataBaseFunction(): Readonly<Store>
  
  protected DataBaseFunction(subscription: DataSubscription<[Readonly<Store>, RecursivePartial<Readonly<Store>>]> | ((full: Readonly<Store>, diff: RecursivePartial<Readonly<Store>>) => void), notifyAboutChangesOfChilds?: true, init?: boolean): DataBaseSubscription<[Readonly<Store>, RecursivePartial<Readonly<Store>>]>
  protected DataBaseFunction(subscription: DataSubscription<[DataBase<Store>, DataBase<Store>, DataBase<Store>]> | ((full: DataBase<Store>, added: DataBase<Store>, removed: DataBase<Store>) => void), notifyAboutChangesOfChilds: false, init?: boolean): DataBaseSubscription<[DataBase<Store>, DataBase<Store>, DataBase<Store>]>



  protected DataBaseFunction<Path extends (keyof Store)>(path: Path): any
  // Not working in ts yet | alternative above
  // private DataBaseFunction<Path extends (keyof Store)>(path: Path): RecursivePathPluckDatabase<Store, [Path]>
  protected DataBaseFunction(path: Data): any
  protected DataBaseFunction(path: DataCollection): any

  protected DataBaseFunction<Path extends (keyof Store)>(path: Path, ...paths: PrimitivePathSegment[]): any
  // Not working in ts yet | alternative above
  // private DataBaseFunction<Paths extends (string | number)[]>(...paths: Paths): RecursivePathPluckDatabase<Store, Paths>

  protected DataBaseFunction<NewStore>(data: NewStore, strict: true): DataBase<Merge<FilterT<NewStore, DefinedFieldUnion<NewStore>>, FilterT<Store, DefinedFieldUnion<NewStore>>>>
  protected DataBaseFunction<NewStore>(data: NewStore, strict: false): DataBase<Merge<FilterT<NewStore, DefinedFieldUnion<NewStore>>, FilterT<Store, DefinedFieldUnion<NewStore>>>>
  protected DataBaseFunction<NewStore>(data: NewStore): DataBase<Merge<FilterT<NewStore, DefinedFieldUnion<NewStore>>, FilterT<Store, DefinedFieldUnion<NewStore>>>>
  
  // Not working in ts yet
  // private DataBaseFunction<Paths extends any[]>(...paths: DataSetify<Paths> & PathSegment[]): RecursivePathPluck<Store, List.Flatten<Paths>>
  protected DataBaseFunction(path_data_subscription?: Data | DataCollection | ComplexData | ((store: Store) => void) | boolean, notifyAboutChangesOfChilds_path_strict?: Data | DataCollection | boolean | PrimitivePathSegment, ...paths: any[]): any {
    const funcThis = this.funcThis

    
    if (path_data_subscription instanceof Data || path_data_subscription instanceof DataCollection || typeof path_data_subscription === "string" || typeof path_data_subscription === "number") {
      let dataSegments = (notifyAboutChangesOfChilds_path_strict === undefined ? [path_data_subscription] : [path_data_subscription, notifyAboutChangesOfChilds_path_strict, ...paths]) as PathSegment[]
      let hasData = (dataSegments as any).ea((e) => {
        if (e instanceof Data || e instanceof DataCollection) return true
      })

      if (hasData) {

        let par = this.pFuncThis
        dataSegments.ea((e: any) => {
          if (e instanceof Data || e instanceof DataCollection) {
            let v = e.get()
            if (v instanceof Array) {
              v.ea((e) => {
                par = par[e]
              })
            }
            else {
              par = par[v]
            }
          }
          else par = par[e]
        })


        let link: any
        if (par instanceof Data) link = new DataLink(this.pFuncThis, dataSegments as any) as any
        else link = new DataBaseLink(this.pFuncThis, dataSegments as any) as any
        localSubscriptionNamespace.register(link)
        return link
      }
      else {
        let ret = this.pFuncThis
        for (let path of dataSegments) {
          //@ts-ignore
          ret = ret[path]
        }
        return ret
      }
    }

    
    else if (typeof path_data_subscription === "function" || path_data_subscription instanceof DataSubscription) {
      const isQueryNeeded = this.queryForGet && this.hasQueryFunc
      if (isQueryNeeded) this.doGetQueryIfNeeded()

      let notifyAboutChangesOfChilds = (notifyAboutChangesOfChilds_path_strict === undefined ? true : notifyAboutChangesOfChilds_path_strict) as boolean
      let subscription = path_data_subscription
      let initialize: boolean = paths[0] === undefined ? !isQueryNeeded : paths[0]

      if (subscription instanceof DataSubscription) return subscription.data(this, false).activate(initialize)
      else if (subscription[dataSubscriptionCbBridge]) return subscription[dataSubscriptionCbBridge].data(this, false).activate(initialize)
      else return new DataBaseSubscription(this as any, subscription as any, true, initialize, notifyAboutChangesOfChilds)
    }
    else if (arguments.length === 0) {
      if (this.queryForGet && this.hasQueryFunc) this.doGetQueryIfNeeded()
      
      return this.store
    }
    else if (typeof path_data_subscription === objectString || path_data_subscription === undefined) {
      const diffFromThis = {removed: {}, added: {}}
      const diffFromChild = {}

      let newData = path_data_subscription as ComplexData
      let strict = notifyAboutChangesOfChilds_path_strict === undefined ? false : notifyAboutChangesOfChilds_path_strict
      
      let handledKeys: string[]


      this.inBulkChange = true
      
      if (strict) handledKeys = [] as any[]
      let explicitDeleteKeys = [] as any[]

      let keysOfNewData: string[]

      try {
        if (newData !== undefined) {
          keysOfNewData = Object.keys(newData)

          for (const key of keysOfNewData) {
            // @ts-ignore
            if (strict) handledKeys.push(key)

            const prop = funcThis[key]
            const newVal = newData[key]
            const defaultVal = this._default !== undefined ? this._default[key] : undefined

            const onDel = () => {
              const diff = {removed: {}}
              diff.removed[key] = undefined
              const f = this.callMeWithDiffIndex.get(key)
              if (f !== undefined) {
                this.funcThis[key][internalDataBaseBridge].removeNotifyParentOfChangeCb(f)
                this.callMeWithDiffIndex.delete(key)
              }
              delete funcThis[key]
              delete newData[key] // isnt this the same as this.store?? Anyways do we need this. As it is not in the other onDel implementation
              delete this.store[key]
              this.aggregateCall(diff, undefined)
              this.flushCall()
            };
            (onDel as any).key = key




            if (newVal === undefined) {
              explicitDeleteKeys.push(key)
              continue
            }
            if (prop !== undefined) {
              if (typeof newVal !== "object") {
                if (prop instanceof Data || prop instanceof Future) {
                  prop.set(newVal)
                }
                else { 
                  //@ts-ignore
                  this.store[key] = newVal
                  diffFromThis.added[key] = newVal
                  prop[internalDataBaseBridge].destroy(this)
                  this.setToFuncThis(key, {value: new Data(newVal, defaultVal), enumerable: true})
                  const specialOnDel = () => {
                    sub.deactivate()
                    onDel()
                  };
                  (specialOnDel as any).key = key
                  funcThis[key].addBeforeDestroyCb(this, specialOnDel)

                  const sub = funcThis[key].get((e) => {
                    const diff = {}
                    diff[key] = e
                    //@ts-ignore
                    this.store[key] = e
                    this.aggregateCall(undefined, {diff, origins: new Set([{c: funcThis[key]}])})
                    this.flushCall()
                  }, false)
                }
                  
              }
              else { // newVal instanceof object
                if (prop instanceof Data && !(prop instanceof Future)) {
                  // prop is Data
                  (this.store as any)[key] = newVal
                  diffFromThis.added[key] = cloneUntilParsingId(newVal)
                  if (newVal[parsingId] === undefined) {
                    //@ts-ignore
                    prop.destroy()

                    this.setToFuncThis(key, {value: new InternalDataBase(this.hasQueryFunc ? async(query) => (await this.queryFunc({[key]: query}))[key] : newVal, defaultVal, this.callMeWithDiff(key))})
                    if (this.hasQueryFunc) funcThis[key](newVal)
                    newVal[parsingId][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
                  }
                  else {
                    const attachF = () => {
                      this.setToFuncThis(key, {value: newVal[parsingId], enumerable: true})
                      newVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
                      newVal[parsingId][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
                    }
                    if (newVal[parsingId] instanceof SyncProm) newVal[parsingId].then((value) => {
                      constructAttatchToPrototype([newVal])(parsingId, {value, enumerable: false})
                      attachF()
                    })
                    else attachF()
                  }
                }
                else { // prop is DB and newVal is obj
                  if (newVal[parsingId] === undefined) {
                    constructAttatchToPrototype([newVal])(parsingId, {value: prop, enumerable: false})
                    prop(newVal, strict)
                  }
                  else {
                    if (newVal[parsingId] !== prop) {
                      //@ts-ignore
                      this.store[key] = newVal
                      diffFromThis.added[key] = newVal
                      prop[internalDataBaseBridge].destroy(this)
                      
                      const attachF = () => {
                        this.setToFuncThis(key, {value: newVal[parsingId]})
                        newVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
                        newVal[parsingId][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
                      }
                      if (newVal[parsingId] instanceof SyncProm) newVal[parsingId].then((value) => {
                        constructAttatchToPrototype([newVal])(parsingId, {value, enumerable: false})
                        attachF()
                      })
                      else attachF()
                    }
                    else return funcThis // cleanup code is in finally block
                    
                  }
                }
              }
            }
            else if (this.hasQueryFunc && this.futFuncThis.hasOwnProperty(key) && this.futFuncThis[key] instanceof Future && !this.futFuncThis[key].resolving) {
              const futVal = this.futFuncThis[key]
              if (typeof newVal === "object") futVal(newVal)
              else if (newVal !== undefined) futVal.set(newVal)
              else {
                // TODO: unsure if this is correct
                explicitDeleteKeys.pop()
              }


            }
            else { // prop is undefined
              if (newVal instanceof Object) {
                (this.store as any)[key] = newVal
                diffFromThis.added[key] = cloneUntilParsingId(newVal)

                if (newVal[parsingId] === undefined) {
                  this.setToFuncThis(key, {value: new InternalDataBase(this.hasQueryFunc ? async(query) => (await this.queryFunc({[key]: query}))[key] : newVal, defaultVal, this.callMeWithDiff(key)), enumerable: true})
                  if (this.hasQueryFunc) funcThis[key](newVal)
                  funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
                }
                else { 
                  const attachF = () => {
                    this.setToFuncThis(key, {value: newVal[parsingId], enumerable: true})
                    newVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))


                    funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
                  }
                  if (newVal[parsingId] instanceof SyncProm) newVal[parsingId].then((value) => {
                    constructAttatchToPrototype([newVal])(parsingId, {value, enumerable: false})
                    attachF()
                  })
                  else attachF()
                }
                
              }
              else { // newVal primitive and prop is undefined
                (this.store as any)[key] = newVal
                diffFromThis.added[key] = newVal
                this.setToFuncThis(key, {value: new Data(newVal, defaultVal), enumerable: true})
                const specialOnDel = () => {
                  sub.deactivate()
                  onDel()
                };
                (specialOnDel as any).key = key
                funcThis[key].addBeforeDestroyCb(this, specialOnDel)
                const sub = funcThis[key].get((e) => {
                  const diff = {}
                  diff[key] = e
                  //@ts-ignore
                  this.store[key] = e
                  this.aggregateCall(undefined, {diff, origins: new Set([{c: funcThis[key]}])})
                  this.flushCall()
                }, false)
              }
            }
          }
        }

        


        const destroyVals = {} as {[key in string]: (Data | DataBase)}
        const removeFunc = (key: string) => {
          const val = funcThis[key]
          // this.callMeWithDiffIndex.delete(key)
          // dont do this here. It is properly handled in destroy
          destroyVals[key] = val
        }

        for (const key of explicitDeleteKeys) {
          removeFunc(key)
        }

        if (strict) {
          for (const key in funcThis) {
            // @ts-ignore
            if (!handledKeys.includes(key)) removeFunc(key)
          }
        }

        this.aggregateCall(diffFromThis, undefined)

        for (const key in destroyVals) {
          const val = destroyVals[key]
          if (val instanceof Data) (val as any).destroy()
          else (val[internalDataBaseBridge as any] as any).destroy(this, key)
        }
        
        this.inBulkChange = false
        this.flushCall()

        return funcThis
      }
      finally {
        this.inBulkChange = false
      }


      
    }
  }



  private initFuncProps(store: Store, _default: any) {
    store = store === undefined ? cloneKeys(_default) : store
    this.store = store
    const funcThis = this.funcThis
    let newStoreKeys = Object.keys(store)
    for (let def in _default) {
      newStoreKeys.gather(def)
    }

    let resParsingId: Function
    constructAttatchToPrototype([this.store])(parsingId, {value: new SyncProm((res) => {resParsingId = res}), enumerable: false})
    


    for (const key of newStoreKeys) {

      const defaultVal = this._default[key]
      const val = store[key]
      const hasQueryFunc = val instanceof Function
      const needFallback = val === undefined || hasQueryFunc
      if (needFallback) (store as any)[key] = defaultVal
      const useVal = needFallback ? defaultVal : val

      

      const setToThis = (e) => this.setToFuncThis(key, {value: e})
      const onDel = () => {
        const diff = {removed: {}}
        diff.removed[key] = undefined
        const f = this.callMeWithDiffIndex.get(key)
        if (f !== undefined) {
          this.funcThis[key][internalDataBaseBridge].removeNotifyParentOfChangeCb(f)
          this.callMeWithDiffIndex.delete(key)
        }
        delete funcThis[key]
        delete this.store[key]
        this.aggregateCall(diff, undefined)
        this.flushCall()
      };   
      (onDel as any).key = key

      if (useVal instanceof Object) {
        if (useVal[parsingId] === undefined) {
          setToThis(new InternalDataBase(val, defaultVal, this.callMeWithDiff(key)))
          if (hasQueryFunc && defaultVal !== undefined) funcThis[key](useVal)
          funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
        }
        else {
          const attachF = () => {
            setToThis(useVal[parsingId])
            useVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
            funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
          }
          if (useVal[parsingId] instanceof SyncProm) useVal[parsingId].then((value) => {
            constructAttatchToPrototype([useVal])(parsingId, {value, enumerable: false})
            attachF()
          })
          else attachF()
        }
      }
      else if (hasQueryFunc && defaultVal === undefined) {
        setToThis(new Future(val, this.callMeWithDiff(key), this as any, key))
        funcThis[key][futurePromiseSym].then((r) => {
          setToThis(r instanceof Data ? r : r.funcThis)
        })
        funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, onDel)
      }
      else {
        setToThis(new Data(val, defaultVal))
        if (hasQueryFunc && defaultVal !== undefined) funcThis[key].set(useVal)

        const specialOnDel = () => {
          sub.deactivate()
          onDel()
        };
        (specialOnDel as any).key = key
        funcThis[key].addBeforeDestroyCb(this, specialOnDel)
        const sub = funcThis[key].get((e) => {
          const diff = {}
          diff[key] = e
          //@ts-ignore
          this.store[key] = e
          this.aggregateCall(undefined, {diff, origins: new Set([{c: funcThis[key]}])})
          this.flushCall()
        }, false)
      }
    }


    constructAttatchToPrototype([this.store])(parsingId, {value: this.funcThis, enumerable: false})
    // @ts-ignore
    resParsingId(this.store[parsingId as any])
  }

  private _queryForGet = true
  private set queryForGet(to: boolean) {
    this._queryForGet = to

    for (const key in this.funcThis) {
      const dat = this.funcThis[key][internalDataBaseBridge]
      if (dat) dat._queryForGet = to
    }
  }
  private get queryForGet() {return this._queryForGet}

  // TODO watch recursion
  private _midQueryForGet = false
  private set midQueryForGet(to: boolean) {
    this._midQueryForGet = to

    for (const key in this.funcThis) {
      const dat = this.funcThis[key][internalDataBaseBridge]
      if (dat) dat.midQueryForGet = to
    }
  }
  private get midQueryForGet() {return this._midQueryForGet}



  updateQueryStatus(queryForGet: boolean = this.queryForGet, midQueryForGet: boolean = this.midQueryForGet) {
    this.queryForGet = queryForGet
    this.midQueryForGet = midQueryForGet

    for (const key in this.funcThis) {
      const dat = this.funcThis[key][internalDataBaseBridge]
      if (dat) {
        dat.queryForGet = queryForGet
        dat.midQueryForGet = midQueryForGet
      }
    }
  }

  
  async doGetQueryIfNeeded() {
    this.queryForGet = false
    this.midQueryForGet = true

    let res: any
    try {
      res = await this.queryFunc(true)
    }
    catch(e) {
      console.error("Failed to interpret results of queryFunc. The provided queryFunc may not return a proper result for the given query.")
      console.error(e)
      this.midQueryForGet = false
      return
    }


    this.funcThis(res)
    this.midQueryForGet = false
  }


  // ------------
  // Functions for Data**Base**Subscription
  // ------------

  subscribeToChildren(subscription: Subscription<[Readonly<Store>, RecursivePartial<Readonly<Store>>]>, initialize: boolean = true): Token<any> {
    if (initialize) subscription(this.store, rmParsingIdWhereNew(diff(subscription[subscriptionDiffSymbol], this.store), subscription[subscriptionDiffSymbol]) as any)
    return this.subscriptionsOfChildChanges.push(subscription as any)
  }
  subscribeToThis(subscription: Subscription<[Readonly<Store>, RecursivePartial<Readonly<Store>>]>, initialize: boolean = true): Token<any> {
    // TODO: This is a call shouldnt there be registerSubscriptionNamespace
    if (initialize) subscription(this.store, diff.flat(subscription[subscriptionDiffSymbol], this.store) as any)
    return this.subscriptionsOfThisChanges.push(subscription as any)
  }

  unsubscribe(subscriptionToken: Token<Subscription<[Readonly<Store>, RecursivePartial<Readonly<Store>>]>>) {
    subscriptionToken.value[subscriptionDiffSymbol] = cloneKeysButKeepSym(this.store)
    subscriptionToken.remove()
  }

  __call(subs: LinkedList<Subscription<[Readonly<Store>, RecursivePartial<Readonly<Store>>, any]>>, ...diff: any[]) {
    const store = this.store
    for (const sub of subs) {
      // @ts-ignore
      sub(store, ...diff)
    }
  }

  call(s) {
    let { subs, need } = needFallbackForSubs(s)
    if (need) subs = console.log("Unexpected error. Cannot propergate call")
    registerSubscriptionNamespace(() => {
      this.__call(subs, this.store)
    }, this.locSubNsReg)
  }
  private diffFromThisCache: {added?: object, removed: object} = {added: {}, removed: {}}
  private diffFromChildCache: object = {}
  private callOrigins = new Set<any>()
  private flushAble = false

  aggregateCall(diffFromThis: {added?: object, removed?: object} | undefined, diffFromChild: {origins: Set<any>, diff: object} | undefined, primaryCall = true) {
    let anyChange = false
    if (diffFromThis) {
      if (diffFromThis.added) {
        if (!isObjectEmpty(diffFromThis.added)) anyChange = true
        for (const key in diffFromThis.added) {
          const callId = {c: this.funcThis[key]}
          this.callOrigins.add(callId);
          (this.diffFromThisCache as any).added[key] = diffFromThis.added[key]
        }
      }
      if (diffFromThis.removed) {
        if (!isObjectEmpty(diffFromThis.removed)) anyChange = true
        for (const key in diffFromThis.removed) {
          const callId = {c: this.funcThis[key]}
          this.callOrigins.add(callId)
          this.diffFromThisCache.removed[key] = diffFromThis.removed[key]
        }
      }
      
    }
    // TODO: remove callOrigins originating from this
    if (diffFromChild) {
      let hasNew = false
      for (const origin of diffFromChild.origins) {
        if (!this.callOrigins.has(origin)) hasNew = true
      }
      // would we benefit from sorting the diffs by origin? So that we could just apply the new origin if one gets added.
      if (hasNew) {
        // if (hasDup) {
        //   console.warn("[DataBase] New and colliding diffs from children. This shouldnt happen.")
        //   // unduplifyNestedObjectPath(this.diffFromChildCache)
        //   // justifyNesting(this.diffFromChildCache)
        // }
        for (const key in diffFromChild.diff) {
          if (!(key in this.diffFromThisCache.removed)) {
            anyChange = true
            this.diffFromChildCache[key] = diffFromChild.diff[key]
          }
        }
        for (const origin of diffFromChild.origins) this.callOrigins.add(origin)

        if (!anyChange) console.warn("JOSM>DataBase: Unexpected edgecase. Handled here but shouldnt happen.")
      }

      
      
      


      // if you enable this instead of the above multiple paths to the diffs (not just the shortest one) will be submitted in (still) one call

      // this.flushAble = true
      // for (const key in diffFromChild.diff) this.diffFromChildCache[key] = diffFromChild.diff[key]
      // for (const origin of diffFromChild.origins) this.callOrigins.add(origin)

    }



    if (anyChange) {
      this.flushAble = true

      let diffFromThisForParents: object

      if (diffFromThis && !isObjectEmpty(diffFromThis.removed)) {
        diffFromThisForParents = {}
  
        if (diffFromThis.added) for (const key in diffFromThis.added) {
          diffFromThisForParents[key] = diffFromThis.added[key]
        }
        if (diffFromThis.removed) for (const key in diffFromThis.removed) {
          diffFromThisForParents[key] = undefined
        }
      }
      else if (diffFromThis !== undefined) diffFromThisForParents = diffFromThis.added as any
      else diffFromThisForParents = {}
  
      const myDiffFromChild = diffFromChild === undefined || diffFromChild.diff === undefined ? {} : diffFromChild.diff
      const diffFromChildAndThis = {...myDiffFromChild, ...diffFromThisForParents} // The order here is important: when deleting the diff from this is applied last, as it trumpfs th sub diff
  

      if (primaryCall) {
        const deeperLs = [] as any[]
        for (const f of this.notifyParentOfChangeCbs) {
          const ret = f(diffFromChildAndThis, this.callOrigins)
          if (ret) deeperLs.push(ret)
        }  

        const recDeeper = () => {
          const deeeep = [] as any[]
          for (const deeper of deeperLs) {
            const ret = deeper()
            if (ret) deeeep.push(ret)
          }
          if (!deeeep.empty) {
            deeperLs.set(deeeep)
            recDeeper()
          }
        }
        recDeeper()
      }
      else {
        const deeperLs = [] as any[]
        const retRecDeeper = () => {
          const deeeep = [] as any[]
          for (const deeper of deeperLs) {
            const ret = deeper()
            if (ret) deeeep.push(ret)
          }
          if (!deeeep.empty) {
            deeperLs.set(deeeep)
            return retRecDeeper
          }
        }
        if (!this.notifyParentOfChangeCbs.empty) return () => {
          for (const f of this.notifyParentOfChangeCbs) {
            const ret = f(diffFromChildAndThis, this.callOrigins)
            if (ret) deeperLs.push(ret)
          }
          if (!deeperLs.empty) return retRecDeeper
        }
      }
    
    }
  }


  flushCall(primaryCall = true) {
    if (!this.flushAble || this.inBulkChange || this.callOrigins.size === 0) return
    let diffFromThisForParents: object
    const diffFromChild = this.diffFromChildCache
    const diffFromThis = this.diffFromThisCache

    if (diffFromThis && !isObjectEmpty(diffFromThis.removed)) {
      diffFromThisForParents = {}

      if (diffFromThis.added) for (const key in diffFromThis.added) {
        diffFromThisForParents[key] = diffFromThis.added[key]
      }
      if (diffFromThis.removed) for (const key in diffFromThis.removed) {
        diffFromThisForParents[key] = undefined
      }
    }
    else diffFromThisForParents = diffFromThis.added as any


    const diffFromChildAndThis = {...diffFromChild, ...diffFromThisForParents} // The order here is important: when deleting the diff from this is applied last, as it trumpfs th sub diff

    




    registerSubscriptionNamespace(() => {
      for (const key in diffFromThis.added) {
        localSubscriptionNamespace.dont(this.funcThis[key])
      }
      if (!isObjectEmpty(diffFromThisForParents)) {
        const store = this.store
        const subs = this.subscriptionsOfThisChanges as any as Function[]
        for (const sub of subs) {
          if (sub.length === 2) (sub as any)(store, diffFromThisForParents)
          else (sub as any)(store, diffFromThis.added, diffFromThis.removed)
        }
      }

      if (!isObjectEmpty(diffFromChildAndThis)) {
        this.__call(this.subscriptionsOfChildChanges as any, diffFromChildAndThis)
      }
    }, this.locSubNsReg)


    this.discardCall()

    

    if (primaryCall) {
      const deeperLs = [] as any[]
      for (const f of this.notifyParentOfChangeCbs) {
        const ret = f.flush()
        if (ret) deeperLs.push(ret)
      }
      const recDeeper = () => {
        const deeeep = [] as any[]
        for (const deeper of deeperLs) {
          const ret = deeper()
          if (ret) deeeep.push(ret)
        }
        if (!deeeep.empty) {
          deeperLs.set(deeeep)
          recDeeper()
        }
      }
      recDeeper()
    }
    else {
      const deeperLs = [] as any[]
      const retRecDeeper = () => {
        const deeeep = [] as any[]
        for (const deeper of deeperLs) {
          const ret = deeper()
          if (ret) deeeep.push(ret)
        }
        if (!deeeep.empty) {
          deeperLs.set(deeeep)
          return retRecDeeper
        }
      }
      if (!this.notifyParentOfChangeCbs.empty) return () => {
        for (const f of this.notifyParentOfChangeCbs) {
          const ret = f.flush()
          if (ret) deeperLs.push(ret)
        }
        if (!deeperLs.empty) return retRecDeeper
      }
    }

    
  }

  discardCall() {
    this.diffFromChildCache = {}
    this.diffFromThisCache = {added: {}, removed: {}}
    this.flushAble = false
    this.callOrigins.clear()
  }


  get(): Readonly<Store> {
    return this.store
  }


  toString(): string {
    return JSON.stringify(this.get(), undefined, "  ")
  }

}


export type DataBaseFunction<Store extends {[key in string]: any}> = InternalDataBase<Store>["DataBaseFunction"]


function functionToStr(func: Function) {
  const str = func.toString()
  const params = str.slice(str.indexOf("(") + 1, nthIndex(str, ")", 1));
  const body = str.slice(str.indexOf("{") + 1, str.lastIndexOf("}"));
  return {params, body}
}



const { params: paramsOfDataBaseFunction, body: bodyOfDataBaseFunction } = functionToStr((InternalDataBase.prototype as any).DataBaseFunctionWrapper)

const objectString: "object" = "object"


type PrimitivePathSegment = string | number
type PathSegment<Of extends PrimitivePathSegment = PrimitivePathSegment> = Of | DataSet<Of[]>
type ComplexData = {[key in string | number]: any}



export type RemovePotentialArrayFunctions<Ob extends object> = Ob extends Array<any> ? Ob extends Array<infer I> ? Omit<Ob, keyof Array<I>> extends {0: any} ? Omit<Ob, keyof Array<any>> : {[key in number]: I} : Ob : Ob


type DataBaseify<Type extends object> = { 
  [Key in keyof Type]: Type[Key] extends object ? RecDataBase<RemovePotentialArrayFunctions<Type[Key]>> : Data<Type[Key]>
}

type RecDataBase<Store extends {[key in string]: any} = {[key in string]: any}> = DataBase<Store>/* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/

// when omiting function props the expression is not callable any more so for now this does nothing (maybe this changes in the future)
type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Omit<Func, FunctionProperties>

export type DataBase<Store extends {[key in string]: any} = {[key in string]: any}, S extends RemovePotentialArrayFunctions<Store> = RemovePotentialArrayFunctions<Store>> = DataBaseify<S> & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

//@ts-ignore
export const DataBase = InternalDataBase as ({ new <Store extends object = any, _Default extends {[key in string]: any} = RecursivePartial<Store>>(store: Store | ((query: QueryForStore<Store>) => (RecursivePartial<Store> | Promise<RecursivePartial<Store>>)), _Default?: _Default): DataBase<Store> })


DataBase.prototype[instanceTypeSym] = "DataBase"
DataLink.prototype[instanceTypeSym] = "Data"
DataBaseLink.prototype[instanceTypeSym] = "DataBase"
DataLink.prototype[instanceTypeLink] = true
DataBaseLink.prototype[instanceTypeLink] = true

