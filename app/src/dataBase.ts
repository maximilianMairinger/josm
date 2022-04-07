import { Data, DataSubscription, DataBaseSubscription, Subscription, DataSet, dataSubscriptionCbBridge, Subscribable, localSubscriptionNamespace, needFallbackForSubs, registerSubscriptionNamespace } from "./data"
import { DataCollection } from "./dataCollection"
import { nthIndex } from "./helper"
import { constructAttatchToPrototype } from "attatch-to-prototype"
import { dbDerivativeCollectionIndex } from "./derivativeExtension"
import diff from "fast-object-diff"
import clone from "fast-copy"

import xtring from "xtring"
xtring()
import xrray from "xrray"
xrray(Array)

import { tunnelSubscription, justInheritanceFlag } from "./data"
import LinkedList, { Token } from "fast-linked-list"
import copy from "fast-copy"


const parsingId = Symbol("parsingId")


interface Link {
  destroy(): void
  resolvePath(): void
  destroyPathSubscriptions(): void
  dataChange(wrapper: DataBase<any>): void
  updatePathResolvent(wrapper?: DataBase<any>): void
} 


function justifyNesting(obj: any) {
  let just = false;
  const deeper = [];
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

function unduplifyNestedObjectPath(root: any) {
  const flatMap = new Map<Object, true>();
  flatMap.set(root, true);

  function unduplify(obj: any) {
    const deeper = [];
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === "object") {
        if (!flatMap.has(val)) {
          flatMap.set(val, true);
          deeper.push(val);
        } else {
          delete obj[key];
        }
      }
    }
    for (const deep of deeper) unduplify(deep);
  }
  unduplify(root);
}


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
      parent = parent[path]
    })

    //@ts-ignore
    if (this._data) this._data.linksOfMe.splice(this._data.linksOfMe.indexOf(this), 1)

    if (this._data !== parent) {
      this._data = parent
      //@ts-ignore
      this._data.linksOfMe.push(this)
      for (const sub of this.subs) sub.data(parent, true)
    }
  }
  destroyPathSubscriptions() {}
  resolvePath() {}
  dataChange(wrapper?: DataBase<any>) {
    this.wrapper = wrapper
  
    this.resolvePath()
  }
}

forwardLink(DataLink, Data)


const dataLinkTokTunnel = Symbol("dataLinkSubTunnel")

class DataBaseLink extends Function implements Link {
  private dataBaseFunc: DataBase<any>
  private dataBase: InternalDataBase<any>
  private funcThis: any
  private wrapper: DataBase<any>
  private paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]
  private currentPathIndex: (string  | number)[]

  private distributedLinks: Link[]
  private subscriptions: DataSubscription<any>[]

  private pathSubscriptions: DataSubscription<PathSegment[]>[]

  // needed registration api
  private _data: any

  

  constructor(wrapper: DataBase<any>, paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]) {
    super(paramsOfDataBaseLinkFunction, bodyOfDataBaseLinkFunction)
    this.funcThis = this.bind(this)

    this.paths = paths
    this.pathSubscriptions = []
    this.distributedLinks = []
    this.subscriptions = []
    
    this.dataChange(wrapper)
    this.initFuncProps()
    

    this.funcThis[internalDataBaseBridge] = this
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
      parent = parent[path]
    })

    if (this.dataBaseFunc !== parent) {
      this.dataBaseFunc = parent
      //@ts-ignore
      this._data = this.dataBase = this.dataBaseFunc[internalDataBaseBridge]


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

  initFuncProps() {
    for (let key in this.dataBaseFunc) {
      
      Object.defineProperty(this.funcThis, key, {
        get: () => {
          let linkInstance: any
          let link: any
          if (this.dataBaseFunc[key] instanceof Data) linkInstance = link = new DataLink(this.dataBaseFunc as any, [key])
          else linkInstance = (link = new DataBaseLink(this.dataBaseFunc as any, [key]))[internalDataBaseBridge]
          // let des = linkInstance.destroy.bind(linkInstance)
          // linkInstance.destroy = () => {
          //   des()
          //   delete this.funcThis[key]
          // }
          // localSubscriptionNamespace.register(linkInstance)
          this.distributedLinks.push(linkInstance)
          Object.defineProperty(this.funcThis, key, {value: link, configurable: true})
          return link
        }, 
        configurable: true
      })
      
    }
  }

  // TODO: get set sub unsub usw

  public toString() {
    return this.dataBase.toString()
  }


  LinkFunctionWrapper(...a) {
    return this.LinkFunction(...a)
  }

  LinkFunction(...a) {
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
      return link
    }
    //@ts-ignore
    else this.dataBaseFunc(...a)
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
        this.updatePathResolvement()
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
})




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

let internalDataBaseBridge = Symbol("InternalDataBaseBridge")


class InternalDataBase<Store extends ComplexData, _Default extends Store = Store> extends Function {
  private funcThis: any

  private store: Store
  private notifyParentOfChangeCbs: any[]
  private beforeDestroyCbs: Map<InternalDataBase<any>, Function>

  public linksOfMe: Link[]

  private subscriptionsOfChildChanges: LinkedList<DataSubscription<[Readonly<Store>]>>
  private subscriptionsOfThisChanges: LinkedList<DataSubscription<[Readonly<Store>]>>

  private callMeWithDiff: (key: string) => ((diff: any, origins: Set<any>) => (() => void))
  private callMeWithDiffIndex: Map<string, ((diff: any, origins: Set<any>) => (() => void))> & { activate(): void, deactivate(): void }

  private locSubNsReg: any[]

  constructor(store?: Store, private _default: _Default = {} as any, notifyParentOfChange?: (diff: any, origins: Set<any>) => (() => void)) {
    super(paramsOfDataBaseFunction, bodyOfDataBaseFunction)
    localSubscriptionNamespace.dont(this)
    this.funcThis = this.bind(this)

    this.linksOfMe = []
    this.locSubNsReg = []
    this.notifyParentOfChangeCbs = []
    this.subscriptionsOfChildChanges = new LinkedList()
    this.subscriptionsOfThisChanges = new LinkedList()
    this.beforeDestroyCbs = new Map

    this.callMeWithDiffIndex = new Map as any
    this.callMeWithDiff = (key: string) => {
      let f = this.callMeWithDiffIndex.get(key)
      if (f !== undefined) {
        this.funcThis[key][internalDataBaseBridge].removeNotifyParentOfChangeCb(f)
      }
      else {
        f = (diff: any, origins: Set<any>) => {
          const nestedDiff = {} 
          nestedDiff[key] = diff
          this.call(undefined, {diff: nestedDiff, origins})
          return () => {
            return this.flushCall(false)
          }
        }
        this.callMeWithDiffIndex.set(key, f)
      }
      
      return f
    }
    this.initFuncProps(store, _default)

    if (notifyParentOfChange) this.addNotifyParentOfChangeCb(notifyParentOfChange)
    

    
    
    

    this.funcThis[internalDataBaseBridge] = this
    const attach = constructAttatchToPrototype(this.funcThis, {enumerable: false})
    const { index } = dbDerivativeCollectionIndex
    for (let key in index) {
      attach(key, index[key])  
    }

    

    return this.funcThis
  }


  


  addNotifyParentOfChangeCb(...cb: ((diff: any, origins: Set<any>) => (() => void))[]) {
    this.notifyParentOfChangeCbs.push(...cb)
  }
  removeNotifyParentOfChangeCb(...cb: ((diff: any, origins: Set<any>) => (() => void))[]) {
    this.notifyParentOfChangeCbs.rmV(...cb)
  }

  private addBeforeDestroyCb(from: InternalDataBase<any>, cb: () => void) {
    this.beforeDestroyCbs.set(from, cb)
  }

  destroy(from: InternalDataBase<any>) {
    this.inBulkChange = true
    this.beforeDestroyCbs.get(from)()
    this.beforeDestroyCbs.delete(from)

    if (this.beforeDestroyCbs.size === 0) {
      this.notifyParentOfChangeCbs.clear()
      for (const key in this.funcThis) {
        if (this.funcThis[key] instanceof Data) {
          this.funcThis[key].destroy(this)
        }
        else {
          this.funcThis[key][internalDataBaseBridge].destroy(this)  
        }
        delete this.funcThis[key]
      }
  
      for (const e of this.linksOfMe) e.destroy()
      this.linksOfMe.clear()
      for (const e of this.locSubNsReg) e.destroy()
      this.locSubNsReg.clear()
  
      for (const key in this) {
        //@ts-ignore
        delete this[key]
      }
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
  
  protected DataBaseFunction(subscription: DataSubscription<[Readonly<Store>, Partial<Readonly<Store>>]> | ((full: Readonly<Store>, diff: Partial<Readonly<Store>>) => void), notifyAboutChangesOfChilds?: true, init?: boolean): DataBaseSubscription<[Readonly<Store>, Partial<Readonly<Store>>]>
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

        let par = funcThis
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
        if (par instanceof Data) link = new DataLink(funcThis, dataSegments as any) as any
        else link = new DataBaseLink(funcThis, dataSegments as any) as any
        localSubscriptionNamespace.register(link)
        return link
      }
      else {
        let ret = funcThis
        for (let path of dataSegments) {
          //@ts-ignore
          ret = ret[path]
        }
        return ret
      }
    }

    
    else if (typeof path_data_subscription === "function" || path_data_subscription instanceof DataSubscription) {
      let notifyAboutChangesOfChilds = (notifyAboutChangesOfChilds_path_strict === undefined ? true : notifyAboutChangesOfChilds_path_strict) as boolean
      let subscription = path_data_subscription
      let initialize: boolean = paths[0] === undefined ? true : paths[0]

      if (subscription instanceof DataSubscription) return subscription.activate(false).data(this, false).call(initialize)
      else if (subscription[dataSubscriptionCbBridge]) return subscription[dataSubscriptionCbBridge]
      else return new DataBaseSubscription(this as any, subscription as any, true, initialize, notifyAboutChangesOfChilds)
    }
    else if (arguments.length === 0) {
      return this.store
    }
    else if (typeof path_data_subscription === objectString || path_data_subscription === undefined) {
      const diffFromThis = {removed: {}, added: {}}
      const diffFromChild = {}

      let newData = path_data_subscription as ComplexData
      let strict = notifyAboutChangesOfChilds_path_strict === undefined ? false : notifyAboutChangesOfChilds_path_strict
      
      let handledKeys: string[]


      this.inBulkChange = true
      
      if (strict) handledKeys = []
      let explicitDeleteKeys = []

      let keysOfNewData: string[]


      if (newData !== undefined) {
        keysOfNewData = Object.keys(newData)

        for (const key of keysOfNewData) {
          if (strict) handledKeys.push(key)

          const prop = funcThis[key]
          const newVal = newData[key]
          const defaultVal = this._default !== undefined ? this._default[key] : undefined

          if (newVal === undefined) {
            explicitDeleteKeys.push(key)
            continue
          }
          if (prop !== undefined) {
            if (prop instanceof Data) {
              if (typeof newVal !== "object") {
                prop.set(newVal)
              }
              else {
                diffFromThis.added[key] = (this.store as any)[key] = newVal
                if (newVal[parsingId] === undefined) {
                  //@ts-ignore
                  prop.destroy()

                  let resParsingId: Function
                  constructAttatchToPrototype([newVal])(parsingId, {value: new Promise((res) => {resParsingId = res})})
                  constructAttatchToPrototype(funcThis)(key, {value: new InternalDataBase(newVal, defaultVal, this.callMeWithDiff(key)), enumerable: true})
                  constructAttatchToPrototype([newVal])(parsingId, {value: funcThis[key]})
                  resParsingId(newVal[parsingId])
                  newVal[parsingId][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                    const diff = {removed: {}}
                    diff.removed[key] = undefined
                    delete newVal[parsingId]
                    delete funcThis[key]
                    delete newData[key]
                    delete this.store[key]
                    this.call(diff, undefined)
                    this.flushCall()
                  })
                }
                else {
                  const attachF = () => {
                    constructAttatchToPrototype(funcThis)(key, {value: newVal[parsingId], enumerable: true})
                    newVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
                  }
                  if (newVal[parsingId] instanceof Promise) newVal[parsingId].then(attachF)
                  else attachF()
                }
              }
            }
            else {
              if (typeof newVal === "object") {
                prop(newVal, strict, parsingId)
              }
              else {
                //@ts-ignore
                diffFromThis.added[key] = this.store[key] = newVal
                prop[internalDataBaseBridge].destroy(this)
                constructAttatchToPrototype(funcThis)(key, {value: new Data(newVal, defaultVal), enumerable: true})
                funcThis[key].addBeforeDestroyCb(this, () => {
                  const diff = {removed: {}}
                  diff.removed[key] = undefined
                  delete newVal[parsingId]
                  delete funcThis[key]
                  delete newData[key]
                  delete this.store[key]
                  sub.deactivate()
                  this.call(diff, undefined)
                  this.flushCall()
                })
                const sub = funcThis[key].get((e) => {
                  const diff = {}
                  diff[key] = e
                  //@ts-ignore
                  this.store[key] = e
                  this.call(undefined, {diff, origins: new Set([funcThis[key]])})
                  this.flushCall()
                }, false)
              }
            }
          }
          else {
            if (typeof newVal === "object") {
              diffFromThis.added[key] = (this.store as any)[key] = newVal
              if (newVal[parsingId] === undefined) {
                let resParsingId: Function
                constructAttatchToPrototype([newVal])(parsingId, {value: new Promise((res) => {resParsingId = res})})
                constructAttatchToPrototype(funcThis)(key, {value: new InternalDataBase(newVal, defaultVal, this.callMeWithDiff(key)), enumerable: true})
                constructAttatchToPrototype([newVal])(parsingId, {value: funcThis[key]})
                resParsingId(newVal[parsingId])

                funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                  const diff = {removed: {}}
                  diff.removed[key] = undefined
                  delete newVal[parsingId]
                  delete funcThis[key]
                  delete newData[key]
                  delete this.store[key]
                  this.call(diff, undefined)
                })
              }
              else {
                const attachF = () => {
                  constructAttatchToPrototype(funcThis)(key, {value: newVal[parsingId], enumerable: true})
                  newVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
                }
                if (newVal[parsingId] instanceof Promise) newVal[parsingId].then(attachF)
                else attachF()
              }
              
            }
            else {
              diffFromThis.added[key] = (this.store as any)[key] = newVal
              constructAttatchToPrototype(funcThis)(key, {value: new Data(newVal, defaultVal), enumerable: true})
              funcThis[key].addBeforeDestroyCb(this, () => {
                const diff = {removed: {}}
                diff.removed[key] = undefined
                delete newVal[parsingId]
                delete funcThis[key]
                delete newData[key]
                delete this.store[key]
                sub.deactivate()
                this.call(diff, undefined)
                this.flushCall()
              })
              const sub = funcThis[key].get((e) => {
                const diff = {}
                diff[key] = e
                //@ts-ignore
                this.store[key] = e
                this.call(undefined, {diff, origins: new Set([funcThis[key]])})
                this.flushCall()
              }, false)
            }
          }
        }
      }

      


      const destroyVals = [] as (Data | DataBase)[]
      const removeFunc = (key: string) => {
        const val = funcThis[key]
        this.callMeWithDiffIndex.delete(key)
        destroyVals.push(diffFromThis.removed[key] = val)
      }

      for (const key of explicitDeleteKeys) {
        removeFunc(key)
      }

      if (strict) {
        for (const key in funcThis) {
          if (!handledKeys.includes(key)) removeFunc(key)
        }
      }

      if (newData !== undefined) {
        this.defaultProps(keysOfNewData)
      }

      this.inBulkChange = false
      this.call(diffFromThis, undefined)
      this.flushCall()
      this.inBulkChange = true

      for (const val of destroyVals) {
        if (val instanceof Data) (val as any).destroy()
        else val[internalDataBaseBridge].destroy(this)
      }
      this.discardCall()
      this.inBulkChange = false


      return funcThis
    }
  }



  private initFuncProps(store: Store, _default: any) {
    store = store === undefined ? _default : store
    this.store = store
    const funcThis = this.funcThis
    let newStoreKeys = Object.keys(store)
    for (let def in _default) {
      newStoreKeys.gather(def)
    }
    

    for (const key of newStoreKeys) {
      const val = store[key] as any
      const defaultVal = this._default !== undefined ? this._default[key] : undefined
      // TODO: Is this needed or can you just make all functions non iteratable
      if (typeof val !== "function") {
        const _setToThis = constructAttatchToPrototype(funcThis, {enumerable: true})
        const setToThis = (e) => _setToThis(key, {value: e})
        if (typeof val === objectString) {
          if (val[parsingId] === undefined) {
            let resParsingId: Function
            constructAttatchToPrototype([val])(parsingId, {value: new Promise((res) => {resParsingId = res})})
            setToThis(new InternalDataBase(val, defaultVal, this.callMeWithDiff(key)))
            constructAttatchToPrototype([val])(parsingId, {value: funcThis[key]})
            resParsingId(val[parsingId])
            funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, (only) => {
              const diff = {removed: {}}
              diff.removed[key] = undefined
              delete val[parsingId]
              delete funcThis[key]
              delete store[key]
              this.call(diff, undefined)
              this.flushCall()
            })
          }
          else {
            const attachF = () => {
              setToThis(val[parsingId])
              val[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
            }
            if (val[parsingId] instanceof Promise) val[parsingId].then(attachF)
            else attachF()
          }
        }
        else {
          setToThis(new Data(val, defaultVal))
          funcThis[key].addBeforeDestroyCb(this, () => {
            const diff = {removed: {}}
            diff.removed[key] = undefined
            delete val[parsingId]
            delete funcThis[key]
            delete store[key]
            sub.deactivate()
            this.call(diff, undefined)
            this.flushCall()
          })
          const sub = funcThis[key].get((e) => {
            const diff = {}
            diff[key] = e
            //@ts-ignore
            this.store[key] = e
            this.call(undefined, {diff, origins: new Set([funcThis[key]])})
            this.flushCall()
          }, false)
        }
      }
      
    }

    this.defaultProps(newStoreKeys)
  }

  private defaultProps(newStoreKeys: string[]) {
    let funcThis = this.funcThis
    let def = this._default
    if (def) {
      let defaultKeys = Object.keys(def)
      
      for (let key of defaultKeys) {
        if (!newStoreKeys.includes(key)) {
          const defVal = def[key]
          const _setToThis = constructAttatchToPrototype(funcThis, {enumerable: true})
          const setToThis = (e) => _setToThis(key, {value: e})
          if (typeof defVal === "object") {
            if (defVal[parsingId] === undefined) {
              let resParsingId: Function
              constructAttatchToPrototype([defVal])(parsingId, {value: new Promise((res) => {resParsingId = res})})
              setToThis(new InternalDataBase({}, defVal, this.callMeWithDiff(key)))
              constructAttatchToPrototype([defVal])(parsingId, {value: funcThis[key]})
              resParsingId(defVal[parsingId])
              funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                const diff = {removed: {}}
                diff.removed[key] = undefined
                delete funcThis[key]
                delete this.store[key]
                this.call(diff, undefined)
                this.flushCall()
              })
              this.store[key as any] = new defVal.constructor
            }
            else {
              const attachF = () => {
                setToThis(defVal[parsingId])
                defVal[parsingId][internalDataBaseBridge].addNotifyParentOfChangeCb(this.callMeWithDiff(key))
              }
              if (defVal[parsingId] instanceof Promise) defVal[parsingId].then(attachF)
              else attachF()
            }
          }
          else {
            setToThis(new Data(undefined, def[key]))
            funcThis[key].addBeforeDestroyCb(this, () => {
              const diff = {removed: {}}
              diff.removed[key] = undefined
              delete funcThis[key]
              delete this.store[key]
              sub.deactivate()
              this.call(diff, undefined)
              this.flushCall()
            })
            const sub = funcThis[key].get((e) => {
              const diff = {}
              diff[key] = e
              //@ts-ignore
              this.store[key] = e
              this.call(undefined, {diff, origins: new Set([funcThis[key]])})
              this.flushCall()
            }, false)
            
            this.store[key as any] = funcThis[key].get()
          }
        }
      }
    }
  }


  // ------------
  // Functions for Data**Base**Subscription
  // ------------

  subscribeToChildren(subscription: Subscription<[Readonly<Store>, Partial<Readonly<Store>>]>, initialize: boolean = true): Token<any> {
    if (initialize) subscription(this.store, diff(subscription[subscriptionDiffSymbol], this.store) as any)
    return this.subscriptionsOfChildChanges.push(subscription as any)
  }
  subscribeToThis(subscription: Subscription<[Readonly<Store>, Partial<Readonly<Store>>]>, initialize: boolean = true): Token<any> {
    if (initialize) subscription(this.store, diff.flat(subscription[subscriptionDiffSymbol], this.store) as any)
    return this.subscriptionsOfThisChanges.push(subscription as any)
  }

  unsubscribe(subscriptionToken: Token<Subscription<[Readonly<Store>, Partial<Readonly<Store>>]>>) {
    subscriptionToken.value[subscriptionDiffSymbol] = clone(this.store)
    subscriptionToken.remove()
  }

  __call(subs: LinkedList<Subscription<[Readonly<Store>, Partial<Readonly<Store>>, any]>>, ...diff: any[]) {
    const store = this.store
    for (const sub of subs) {
      // @ts-ignore
      sub(store, ...diff)
    }
  }
  private diffFromThisCache: {added?: object, removed: object} = {added: {}, removed: {}}
  private diffFromChildCache: object = {}
  private callOrigins = new Set<any>()
  private flushAble = false
  private canRemoveFromOriginAfterFlushTimeout = []
  private canRemoveFromOriginAfterFlush = []

  call(diffFromThis: {added?: object, removed?: object} | undefined, diffFromChild: {origins: Set<any>, diff: object} | undefined) {
    if (diffFromThis) {
      if (diffFromThis.added) for (const key in diffFromThis.added) {
        this.callOrigins.add(this.funcThis[key])
        this.canRemoveFromOriginAfterFlush.push(this.funcThis[key])
        this.diffFromThisCache.added[key] = diffFromThis.added[key]
      }
      if (diffFromThis.removed) for (const key in diffFromThis.removed) {
        this.callOrigins.add(this.funcThis[key])
        this.canRemoveFromOriginAfterFlush.push(this.funcThis[key])
        this.diffFromThisCache.removed[key] = diffFromThis.removed[key]
      }
      this.flushAble = true
    } 
    // TODO: remove callOrigins originating from this
    if (diffFromChild) {
      let hasDup = false
      let hasNew = false
      for (const origin of diffFromChild.origins) {
        if (this.callOrigins.has(origin)) hasDup = true
        else {
          this.canRemoveFromOriginAfterFlushTimeout.push(origin)
          hasNew = true
        }
      }
      if (hasNew) {
        this.flushAble = true
        for (const key in diffFromChild.diff) this.diffFromChildCache[key] = diffFromChild.diff[key]
        for (const origin of diffFromChild.origins) this.callOrigins.add(origin)

        // if (hasDup) {
        //   console.warn("[DataBase] New and colliding diffs from children. This shouldnt happen.")
          // unduplifyNestedObjectPath(this.diffFromChildCache)
          // justifyNesting(this.diffFromChildCache)
        // }
      }
      


      // if you enable this instead of the above multiple paths to the diffs (not just the shortest one) will be submitted in (still) one call

      // this.flushAble = true
      // for (const key in diffFromChild.diff) this.diffFromChildCache[key] = diffFromChild.diff[key]
      // for (const origin of diffFromChild.origins) this.callOrigins.add(origin)

    }

  }


  flushCall(primaryFlush = true) {
    if (!this.flushAble || this.inBulkChange) return
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
    else diffFromThisForParents = diffFromThis.added

    if (!isObjectEmpty(diffFromThisForParents)) {
      registerSubscriptionNamespace(() => {
        const store = this.store
        const subs = this.subscriptionsOfThisChanges as any as Function[]
        for (const sub of subs) {
          if (sub.length === 2) (sub as any)(store, diffFromThisForParents)
          else (sub as any)(store, diffFromThis.added, diffFromThis.removed)
        }
      }, this.locSubNsReg)
    }

    if (diffFromChild && !isObjectEmpty(diffFromChild)) {
      registerSubscriptionNamespace(() => {
        this.__call(this.subscriptionsOfChildChanges as any, diffFromChild)
      }, this.locSubNsReg)
    }


    const deeperLs = []
    for (const f of this.notifyParentOfChangeCbs) deeperLs.push(f({...diffFromThisForParents, ...diffFromChild}, this.callOrigins))
    this.discardCall()

    if (primaryFlush) {
      const recDeeper = () => {
        const deeeep = []
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
      const retRecDeeper = () => {
        const deeeep = []
        for (const deeper of deeperLs) {
          const ret = deeper()
          if (ret) deeeep.push(ret)
        }
        if (!deeeep.empty) {
          deeperLs.set(deeeep)
          return retRecDeeper
        }
      }
      return retRecDeeper
    }

    
  }

  discardCall() {
    this.diffFromChildCache = {}
    this.diffFromThisCache = {added: {}, removed: {}}
    this.flushAble = false
    for (const rm of this.canRemoveFromOriginAfterFlush) this.callOrigins.delete(rm)
    const canRemoveFromOriginAfterFlush = [...this.canRemoveFromOriginAfterFlushTimeout]
    setTimeout(() => {
      for (const rm of canRemoveFromOriginAfterFlush) this.callOrigins.delete(rm)
    })
  }


  get(): Readonly<Store> {
    return this.store
  }


  toString(): string {
    return JSON.stringify(this.get(), undefined, "  ")
  }

}


export type DataBaseFunction<Store extends {[key in string]: any}> = InternalDataBase<Store>["DataBaseFunction"]

const subscriptionDiffSymbol = Symbol("diff")



//@ts-ignore
const entireDataBaseFunction = InternalDataBase.prototype.DataBaseFunctionWrapper.toString(); 
const paramsOfDataBaseFunction = entireDataBaseFunction.slice(entireDataBaseFunction.indexOf("(") + 1, nthIndex(entireDataBaseFunction, ")", 1));
const bodyOfDataBaseFunction = entireDataBaseFunction.slice(entireDataBaseFunction.indexOf("{") + 1, entireDataBaseFunction.lastIndexOf("}"));


const objectString: "object" = "object"


type PrimitivePathSegment = string | number
type PathSegment<Of extends PrimitivePathSegment = PrimitivePathSegment> = Of | DataSet<Of[]>
type ComplexData = {[key in string | number]: any}



export type RemovePotentialArrayFunctions<Ob extends object> = Ob extends Array<any> ? Ob extends Array<infer I> ? Omit<Ob, keyof Array<I>> extends {0: any} ? Omit<Ob, keyof Array<any>> : {[key in number]: I} : Ob : Ob


type DataBaseify<Type extends object> = { 
  [Key in keyof Type]: Type[Key] extends object ? RecDataBase<RemovePotentialArrayFunctions<Type[Key]>> : Data<Type[Key]>
}

type RecDataBase<Store extends {[key in string]: any} = unknown> = DataBase<Store>/* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/

// when omiting function props the expression is not callable any more so for now this does nothing (maybe this changes in the future)
type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Omit<Func, FunctionProperties>

export type DataBase<Store extends {[key in string]: any} = unknown, S extends RemovePotentialArrayFunctions<Store> = RemovePotentialArrayFunctions<Store>> = DataBaseify<S> & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>

//@ts-ignore
export const DataBase = InternalDataBase as ({ new <Store extends object = any, _Default extends {[key in string]: any} = Store>(store: Store, _Default?: _Default): DataBase<Store> })
