import { Data, DataSubscription, DataBaseSubscription, Subscription, DataSet, dataSubscriptionCbBridge, Subscribable, localSubscriptionNamespace, needFallbackForSubs, registerSubscriptionNamespace } from "./data"
import { DataCollection } from "./dataCollection"
import { nthIndex } from "./helper"
import { constructAttatchToPrototype } from "attatch-to-prototype"
import { dbDerivativeLiableIndex } from "./derivativeExtension"

import xrray from "xrray"
xrray(Array)
import xtring from "xtring"
import { tunnelSubscription, justInheritanceFlag } from "./data"
xtring()



interface Link {
  destroy(): void
  resolvePath(): void
  destroyPathSubscriptions(): void
  dataChange(wrapper: DataBase<any>): void
  updatePathResolvent(wrapper?: DataBase<any>): void
} 


function forwardLink(target: any, forwards: string[], instancePath: string): void
function forwardLink(target: any, source: any, instancePath: string): void
function forwardLink(target: any, source_forwards: any | string[], instancePath: string = "_data") {
  let tarProto = target.prototype
  let forwards: string[]
  if (source_forwards instanceof Array) forwards = source_forwards
  else {
    let src = Object.getOwnPropertyNames(source_forwards.prototype).rmV("constructor")
    let tar = Object.getOwnPropertyNames(tarProto).rmV("constructor")
    forwards = []
    for (let k of src) {
      if (!tar.includes(k)) forwards.add(k)
    }
  }
  
  const attach = constructAttatchToPrototype(tarProto)
  for (let functionName of forwards) {
    attach(functionName, function (...a) {
      this[instancePath][functionName](...a)
    })
  }
}

//@ts-ignore
export class DataLink extends Data implements Link {
  private pathSubscriptions: DataSubscription<PathSegment[]>[] | PrimitivePathSegment[] = []
  private wrapper: DataBase<any>
  private _data: Data<any>
  private subs: DataSubscription<any>[] = []

  private currentPathIndex: PrimitivePathSegment[]

  constructor(wrapper: DataBase<any>, private paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]) {
    super(justInheritanceFlag)
    this.dataChange(wrapper)
  }
  protected destroy() {
    this.destroyPathSubscriptions()

    this.subs.Inner("deactivate", [])
    this.subs.clear()

    for (let key in this) {
      delete this[key]
    }
  }

  tunnel(func: Function): any {
    let d = this._data.tunnel(func as any)
    this.subs.add(d[tunnelSubscription])
    return d
  }

  
  get(cb?: Function | DataSubscription<any>, init?: boolean) {
    if (cb) {
      let sub = this._data.get(cb as any, init)
      this.subs.add(sub)
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
    this.subs.rmV(sub)
    return sub
  }


  updatePathResolvent(wrapper: DataBase<any> = this.wrapper) {
    let parent = this.wrapper = wrapper as any
    this.currentPathIndex.ea((path) => {
      parent = parent[path]
    })

    //@ts-ignore
    if (this._data) this._data.linksOfMe.rmV(this)

    if (this._data !== parent) {
      this._data = parent
      //@ts-ignore
      this._data.linksOfMe.add(this)
      this.subs.Inner("data", [parent, true])
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
    const attach = constructAttatchToPrototype(this.funcThis)
    dbDerivativeLiableIndex.ea((e) => {
      for (let key in e) {
        attach(key, e[key])  
      }
    })

    return this.funcThis
  }

  destroy() {
    // this is only getting called from InternalDataBase.

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


      this.dataBase.linksOfMe.add(this)
      //@ts-ignore
      this.subscriptions.Inner("data", [this.dataBase, true])
      this.distributedLinks.Inner("dataChange", [this.dataBaseFunc])
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
          let link: Link
          if (this.dataBaseFunc[key] instanceof Data) linkInstance = link = new DataLink(this.dataBaseFunc as any, [key])
          else linkInstance = (link = new DataBaseLink(this.dataBaseFunc as any, [key]))[internalDataBaseBridge]
          let des = linkInstance.destroy.bind(linkInstance)
          linkInstance.destroy = () => {
            des()
            delete this.funcThis[key]
          }
          localSubscriptionNamespace.register(linkInstance)
          this.distributedLinks.add(linkInstance)
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
      this.subscriptions.add(sub)
      return sub
    }
    else if (a[0] instanceof Data || a[0] instanceof DataCollection || typeof a[0] === "string" || typeof a[0] === "number") {
      //@ts-ignore
      let link = this.dataBaseFunc(...a)
      //@ts-ignore
      this.distributedLinks.add(link)
      return link
    }
    //@ts-ignore
    else this.dataBaseFunc(...a)
  }



  // TODO
}



const attachToLinks = constructAttatchToPrototype([DataBaseLink, DataLink].inner("prototype"))



attachToLinks("resolvePath", function() {

  this.currentPathIndex = []

  let top = 0

  for (let i = 0; i < this.paths.length; i++) {
    const path = this.paths[i];
    const localTop = top
    
    if (path instanceof Data) {
      this.pathSubscriptions.add(path.get((e) => {
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
      

      this.pathSubscriptions.add(path.get((...e) => {
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



  

  this.updatePathResolvement()
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
let e: e

type FilterT<T extends {[key in string | number | symbol]: any}, Filter extends string | number | symbol, ProperFilter extends DefinedFieldUnion<{[key in Filter]: key extends keyof T ? T[key] : undefined}> = DefinedFieldUnion<{[key in Filter]: key extends keyof T ? T[key] : undefined}>> = { [K in ProperFilter]: T[K] extends {[key in string | number | symbol]: any} ? FilterT<T[K], Filter> : T[K] }
type f = FilterT<{q: number}, "q" | "w">

type Filter = "q" | "w"
type T = {q: number}
type qq = DefinedFieldUnion<{[key in Filter]: key extends keyof T ? T[key] : undefined}>

type test = DataBase<FilterT<S, DefinedFieldUnion<S>>>
let t: test



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


class InternalDataBase<Store extends ComplexData, Default extends Store = Store> extends Function {
  private funcThis: any

  private store: Store
  private notifyParentOfChangeCbs: any[]
  private beforeDestroyCbs: Map<InternalDataBase<any>, Function>

  public linksOfMe: Link[]

  private subscriptionsOfChildChanges: DataSubscription<[Readonly<Store>]>[]
  private subscriptionsOfThisChanges: DataSubscription<[Readonly<Store>]>[]

  private boundCall: () => void

  private locSubNsReg: any[]

  constructor(store: Store, private Default?: Default, parsingId?: Symbol, notifyParentOfChange?: () => void) {
    super(paramsOfDataBaseFunction, bodyOfDataBaseFunction)
    localSubscriptionNamespace.dont(this)
    this.funcThis = this.bind(this)

    this.linksOfMe = []
    this.locSubNsReg = []
    this.notifyParentOfChangeCbs = []
    this.subscriptionsOfChildChanges = []
    this.subscriptionsOfThisChanges = []
    this.beforeDestroyCbs = new Map
    this.boundCall = this.call.bind(this)
    this.initFuncProps(store, parsingId)

    if (notifyParentOfChange) this.addNotifyParentOfChangeCb(notifyParentOfChange)
    

    
    
    

    this.funcThis[internalDataBaseBridge] = this
    const attach = constructAttatchToPrototype(this.funcThis)
    dbDerivativeLiableIndex.ea((e) => {
      for (let key in e) {
        attach(key, e[key])  
      }
    })

    

    return this.funcThis
  }


  


  addNotifyParentOfChangeCb(cb: () => void) {
    this.notifyParentOfChangeCbs.add(cb)
    return cb
  }
  removeNotifyParentOfChangeCb(cb: () => void) {
    this.notifyParentOfChangeCbs.rmV(cb)
    return cb
  }

  private addBeforeDestroyCb(from: InternalDataBase<any>, cb: () => void) {
    this.beforeDestroyCbs.set(from, cb)
  }

  destroy(from: InternalDataBase<any>) {
    this.inBulkChange = true
    this.beforeDestroyCbs.get(from)()
    this.beforeDestroyCbs.delete(from)

    if (this.beforeDestroyCbs.size === 0) {
      this.beforeDestroyCbs.forEach((val) => {
        val()
      })
      this.notifyParentOfChangeCbs.clear()
      for (const key in this.funcThis) {
        if (this.funcThis[key] instanceof Data) {
          this.funcThis[key].destroy(this)
        }
        else {
          // TODO: WHAT????
          this.funcThis[key][internalDataBaseBridge].destroy(this)  
        this.funcThis[key][internalDataBaseBridge].destroy(this)
          this.funcThis[key][internalDataBaseBridge].destroy(this)  
        this.funcThis[key][internalDataBaseBridge].destroy(this)
          this.funcThis[key][internalDataBaseBridge].destroy(this)  
        }
        delete this.funcThis[key]
      }
  
      this.linksOfMe.Inner("destroy", [])
      this.linksOfMe.clear()
      this.locSubNsReg.Inner("destroy", [])
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
  
  protected DataBaseFunction(subscription: DataSubscription<[Readonly<Store>]>, notifyAboutChangesOfChilds?: boolean, init?: boolean): DataBaseSubscription<[Store]>
  protected DataBaseFunction(subscription: Function, notifyAboutChangesOfChilds?: boolean, init?: boolean): DataBaseSubscription<[Store]>

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
      else if ((notifyAboutChangesOfChilds ? this.subscriptionsOfChildChanges : this.subscriptionsOfThisChanges).contains(subscription as any)) return subscription[dataSubscriptionCbBridge]
      else return new DataBaseSubscription(this as any, subscription as any, true, initialize, notifyAboutChangesOfChilds)
    }
    else if (path_data_subscription === undefined) {
      return this.store
    }
    else if (typeof path_data_subscription === objectString) {
      let newData = path_data_subscription as ComplexData
      let strict = notifyAboutChangesOfChilds_path_strict === undefined ? false : notifyAboutChangesOfChilds_path_strict

      let parsingId = (paths[0] !== undefined ? paths[0] : Symbol("parsingId")) as any
      
      let handledKeys: string[]

      let notifyFromThis = false

      this.inBulkChange = true
      
      if (strict) handledKeys = []
      let explicitDeleteKeys = []

      let keysOfNewData = Object.keys(newData)

      for (const key of keysOfNewData) {
        if (strict) handledKeys.add(key)

        const prop = funcThis[key]
        const newVal = newData[key]
        const defaultVal = this.Default !== undefined ? this.Default[key] : undefined

        if (newVal === undefined) {
          explicitDeleteKeys.add(key)
          continue
        }
        if (prop !== undefined) {
          if (prop instanceof Data) {
            if (typeof newVal !== "object") {
              prop.set(newVal)
            }
            else {
              if (newVal[parsingId] === undefined) {
                //@ts-ignore
                this.store[key] = newVal
                //@ts-ignore
                prop.destroy()

                constructAttatchToPrototype([newVal, funcThis])(parsingId, new InternalDataBase(newVal, defaultVal, parsingId, this.boundCall))
                newVal[parsingId][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                  delete newVal[parsingId]
                  delete funcThis[key]
                  delete newData[key]
                  delete this.store[key]
                  this.call(undefined, true)
                })
              }
              else {
                funcThis[key] = newVal[parsingId]
              }

              notifyFromThis = true

            }
          }
          else {
            if (typeof newVal === "object") {
              let duringActivationNotificationBundler = () => {
                notifyFromThis = true
              }
              // cache all changes coming from below (children) so that only one change event gets emitted
              let db = prop[internalDataBaseBridge]
              db.removeNotifyParentOfChangeCb(this.boundCall)
              db.addNotifyParentOfChangeCb(duringActivationNotificationBundler)
              prop(newVal, strict, parsingId)
              db.removeNotifyParentOfChangeCb(duringActivationNotificationBundler)
              db.addNotifyParentOfChangeCb(this.boundCall)
            }
            else {
              //@ts-ignore
              this.store[key] = newVal
              prop.destroy(this)
              funcThis[key] = new Data(newVal, defaultVal)
              funcThis[key].addBeforeDestroyCb(this, () => {
                
                delete newVal[parsingId]
                delete funcThis[key]
                delete newData[key]
                delete this.store[key]
                this.call(undefined, true)
              })
              funcThis[key].get((e) => {
                //@ts-ignore
                this.store[key] = e
                this.call(undefined, false)
              }, false)

              notifyFromThis = true
            }
          }
        }
        else {
          if (typeof newVal === "object") {
            if (newVal[parsingId] === undefined) {
              constructAttatchToPrototype([newVal, funcThis])(parsingId, new InternalDataBase(newVal, defaultVal, parsingId, this.boundCall))
              funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                
                delete newVal[parsingId]
                delete funcThis[key]
                delete newData[key]
                delete this.store[key]
                this.call(undefined, true)
              })
              //@ts-ignore
              this.store[key] = newVal
            }
            else {
              funcThis[key] = newVal[parsingId]
            }
            
          }
          else {
            //@ts-ignore
            this.store[key] = newVal
            funcThis[key] = new Data(newVal, defaultVal)
            funcThis[key].addBeforeDestroyCb(this, () => {

              delete newVal[parsingId]
              delete funcThis[key]
              delete newData[key]
              delete this.store[key]
              this.call(undefined, true)
            })
            funcThis[key].get((e) => {
              //@ts-ignore
              this.store[key] = e
              this.call(undefined, false)
            }, false)
          }
          notifyFromThis = true
        }
      }

      const destroyFunc = (key: string) => {
        if (funcThis[key] instanceof Data) funcThis[key].destroy()
        else funcThis[key][internalDataBaseBridge].destroy(this)
        notifyFromThis = true
      }

      for (const key of explicitDeleteKeys) {
        destroyFunc(key)
      }

      if (strict) {
        for (const key in funcThis) {
          if (!handledKeys.includes(key)) destroyFunc(key)
        }
      }

      this.defaultProps(keysOfNewData, parsingId)

      this.inBulkChange = false

      if (notifyFromThis) this.call(undefined, true)

      return funcThis
    }
    
    
    
  }



  private initFuncProps(store: Store, parsingId: any) {
    this.store = store
    if (parsingId === undefined) parsingId = Symbol("parsingId")
    const funcThis = this.funcThis
    let newStoreKeys = Object.keys(store)
    

    for (const key of newStoreKeys) {
      const val = store[key] as any
      const defaultVal = this.Default !== undefined ? this.Default[key] : undefined
      // TODO: Is this needed or can you just make all functions non iteratable
      if (typeof val !== "function") {
        
        if (typeof val === objectString) {
          if (val[parsingId] === undefined) funcThis[key] = constructAttatchToPrototype(val)(parsingId, new InternalDataBase(val, defaultVal, parsingId, this.boundCall))
          else funcThis[key] = val[parsingId]
          funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {

            delete funcThis[key]
            delete store[key]
            this.call(undefined, true)
          })
        }
        else {
          funcThis[key] = new Data(val, defaultVal)
          funcThis[key].addBeforeDestroyCb(this, () => {

            delete funcThis[key]
            delete store[key]
            this.call(undefined, true)
          })
          funcThis[key].get((e) => {
            //@ts-ignore
            this.store[key] = e
            this.call(undefined, false)
          }, false)
        }
      }
      
    }

    this.defaultProps(newStoreKeys, parsingId)
  }

  private defaultProps(newStoreKeys: string[], parsingId: Symbol) {
    let funcThis = this.funcThis
    let def = this.Default
    if (def) {
      let defaultKeys = Object.keys(def)
      
      for (let key of defaultKeys) {
        if (!newStoreKeys.includes(key)) {
          if (typeof def[key] === "object") {
            funcThis[key] = new InternalDataBase({}, def[key], parsingId, this.boundCall)
            funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
              delete funcThis[key]
              delete this.store[key]
              this.call(undefined, true)
            })
            this.store[key as any] = new def[key].constructor
          }
          else {
            funcThis[key] = new Data(undefined, def[key])
            funcThis[key].addBeforeDestroyCb(this, () => {
              delete funcThis[key]
              delete this.store[key]
              this.call(undefined, true)
            })
            funcThis[key].get((e) => {
              //@ts-ignore
              this.store[key] = e
              this.call(undefined, false)
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

  subscribeToChildren(subscription: Subscription<[Readonly<Store>]>, initialize?: boolean, ): void {
    if (initialize === undefined || initialize) subscription(this.store)
    //@ts-ignore
    this.subscriptionsOfChildChanges.add(subscription)
  }
  subscribeToThis(subscription: Subscription<[Readonly<Store>]>, initialize?: boolean): void {
    if (initialize === undefined || initialize) subscription(this.store)
    //@ts-ignore
    this.subscriptionsOfThisChanges.add(subscription)
  }

  unsubscribeToChildren(subscription: Subscription<[Readonly<Store>]>): void {
    //@ts-ignore
    this.subscriptionsOfChildChanges.rmV(subscription)
  }
  unsubscribeToThis(subscription: Subscription<[Readonly<Store>]>): void {
    //@ts-ignore
    this.subscriptionsOfThisChanges.rmV(subscription)
  }
  __call(subs: Subscription<[Readonly<Store>]>[]) {
    subs.Call(this.store)
  }
  call(s: any, fromThis: boolean = false) {
    if (!this.inBulkChange) {
      let { subs, need } = needFallbackForSubs(s)
      if (need) {
        if (fromThis) {
          registerSubscriptionNamespace(() => {
            this.__call(this.subscriptionsOfThisChanges as any)
          }, this.locSubNsReg)
        }
        
        
        // ---- from child ----
        this.notifyParentOfChangeCbs.Call()
        registerSubscriptionNamespace(() => {
          this.__call(this.subscriptionsOfChildChanges as any)
        }, this.locSubNsReg)
      }
      else {
        this.__call(subs)
      }
    }
  }

  isSubscribed(subscription: Subscription<[Readonly<Store>]>): boolean {
    //@ts-ignore
    return this.subscriptionsOfChildChanges.includes(subscription) || this.subscriptionsOfThisChanges.includes(subscription)
  }

  get(): Readonly<Store> {
    return this.store
  }


  toString(): string {
    return JSON.stringify(this.get(), undefined, "  ")
  }

}



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

type RecDataBase<Store extends {[key in string]: any} = unknown> = DataBaseify<Store>/* & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)*/

// when omiting function props the expression is not callable any more so for now this does nothing (maybe this changes in the future)
type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Omit<Func, FunctionProperties>

export type DataBase<Store extends {[key in string]: any} = unknown, S extends RemovePotentialArrayFunctions<Store> = RemovePotentialArrayFunctions<Store>> = DataBaseify<S> & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>

//@ts-ignore
export const DataBase = InternalDataBase as ({ new <Store extends object = any, Default extends {[key in string]: any} = Store>(store: Store, Default?: Default): DataBase<Store> })
