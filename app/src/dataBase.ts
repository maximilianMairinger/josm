import { Data, DataSubscription, DataCollection, Subscription, DataSet, dataSubscriptionCbBridge, Subscribable, localSubscriptionNamespace } from "./data"
import { nthIndex } from "./helper"
import { constructAttatchToPrototype } from "attatch-to-prototype"
import { dataDerivativeLiableIndex, dbDerivativeLiableIndex } from "./utils"
import clone from "fast-copy"


console.log(Data)

interface Link {
  destroy(): void
  resolvePath(): void
  destroyPathSubscriptions(): void
  dataChange(wrapper: DataBase<any>): void
  updatePathResolvement(wrapper?: DataBase<any>): void
} 

class DataLink implements Link {
  private pathSubscriptions: DataSubscription<PathSegment[]>[] | PrimitivePathSegment[] = []
  private wrapper: DataBase<any>
  private data: Data<any>

  private currentPathIndex: PrimitivePathSegment[]

  constructor(wrapper: DataBase<any>, private paths: DataSet<PrimitivePathSegment[]>[] | PrimitivePathSegment[]) {
    this.dataChange(wrapper)
  }
  destroy() {
    this.destroyPathSubscriptions()

    this.subscriptions.Inner("deacivate", [])
    this.subscriptions.clear()

    for (let key in this) {
      delete this[key]
    }
  }

  private subscriptions: DataSubscription<any>[] = []
  get(cb?: Function | DataSubscription<any>, init?: boolean) {
    if (cb) {
      let sub = this.data.get(cb as any, init)
      this.subscriptions.add(sub)
      return sub
    }
    else return this.data.get()
  }

  subscribe(...a) {
    //@ts-ignore
    this.data.subscribe(...a)
  }

  unsubscribe(...a) {
    //@ts-ignore
    this.data.unsubscribe(...a)
  }

  isSubscribed(...a) {
    //@ts-ignore
    this.data.isSubscribed(...a)
  }

  set(...a: any) {
    //@ts-ignore
    return this.data.set(...a)
  }

  toString() {
    return this.data.toString()
  }

  got(...a) {
    //@ts-ignore
    let sub = this.data.got(...a)
    this.subscriptions.rmV(sub)
    return sub
  }


  updatePathResolvement(wrapper: DataBase<any> = this.wrapper) {
    let parent = this.wrapper = wrapper as any
    this.currentPathIndex.ea((path) => {
      parent = parent[path]
    })

    //@ts-ignore
    if (this.data) this.data.linksOfMe.rmV(this)

    if (this.data !== parent) {
      this.data = parent
      //@ts-ignore
      this.data.linksOfMe.add(this)
      this.subscriptions.Inner("data", [parent, true])
    }
  }
  destroyPathSubscriptions() {}
  resolvePath() {}
  dataChange(wrapper?: DataBase<any>) {
    this.wrapper = wrapper
  
    this.resolvePath()
  }
}


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
  updatePathResolvement(wrapper: DataBase<any> = this.wrapper) {
    if (this.dataBase) this.dataBase.linksOfMe.rmV(this)

    let parent = this.wrapper = wrapper as any
    this.currentPathIndex.ea((path) => {
      parent = parent[path]
    })

    if (this.dataBaseFunc !== parent) {
      this.dataBaseFunc = parent
      //@ts-ignore
      this.dataBase = this.dataBaseFunc[internalDataBaseBridge]


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
      let link: Link
      Object.defineProperty(this.funcThis, key, {
        get: () => {
          if (link === undefined) {
            if (this.dataBaseFunc[key] instanceof Data) link = new DataLink(this.dataBaseFunc as any, [key])
            else link = new DataBaseLink(this.dataBaseFunc as any, [key])
            localSubscriptionNamespace.register({destroy: () => {
              link.destroy()
              link = undefined
            }})
            this.distributedLinks.add(link)
          }
          return link
        }
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
      let sub = this.dataBaseFunc(...a)
      this.subscriptions.add(sub)
      return sub
    }
    else if (a[0] instanceof Data || a[0] instanceof DataCollection || typeof a[0] === "string" || typeof a[0] === "number") {
      let link = this.dataBaseFunc(...a)
      this.distributedLinks.add(link)
      return link
    }
    else this.dataBaseFunc(...a)
  }

}



const attachToLinks = constructAttatchToPrototype([DataBaseLink.prototype, DataLink.prototype])



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








//@ts-ignore
const entireDataBaseLinkFunction = DataBaseLink.prototype.LinkFunctionWrapper.toString(); 
const paramsOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("(") + 1, nthIndex(entireDataBaseLinkFunction, ")", 1));
const bodyOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("{") + 1, entireDataBaseLinkFunction.lastIndexOf("}"));

let internalDataBaseBridge = Symbol("InternalDataBaseBridge")


class InternalDataBase<Store extends ComplexData> extends Function {
  private funcThis: any

  private store: Store
  private notifyParentOfChangeCbs: any[]
  private beforeDestroyCbs: Map<InternalDataBase<any>, Function>

  public linksOfMe: Link[]

  private subscriptionsOfChildChanges: DataSubscription<[Readonly<Store>]>[]
  private subscriptionsOfThisChanges: DataSubscription<[Readonly<Store>]>[]

  private boundNotifyFromChild: () => void

  constructor(store: Store, parsingId: Symbol, notifyParentOfChange?: () => void) {
    super(paramsOfDataBaseFunction, bodyOfDataBaseFunction)
    this.funcThis = this.bind(this)

    this.linksOfMe = []
    this.notifyParentOfChangeCbs = []
    this.subscriptionsOfChildChanges = []
    this.subscriptionsOfThisChanges = []
    this.beforeDestroyCbs = new Map
    this.boundNotifyFromChild = this.notifyFromChild.bind(this)
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
    return this.DataBaseFunction(...a)
  }




  private DataBaseFunction(...paths: PathSegment[]): any
  private DataBaseFunction<NewStore extends ComplexData>(data: NewStore, strict?: boolean): DataBase<NewStore & Store>
  private DataBaseFunction(): Store
  private DataBaseFunction(subscription: DataSubscription<[Readonly<Store>]>, notfiyAboutChangesOfChilds?: boolean, init?: boolean): DataBaseSubscription<[Store]>
  private DataBaseFunction(path_data_subscription?: PathSegment | ComplexData | ((store: Store) => void), notfiyAboutChangesOfChilds_path_strict?: PathSegment | boolean, ...paths: any[]): any {
    const funcThis = this.funcThis

    
    
    if (path_data_subscription instanceof Data || path_data_subscription instanceof DataCollection || typeof path_data_subscription === "string" || typeof path_data_subscription === "number") {
      let dataSegments = (notfiyAboutChangesOfChilds_path_strict === undefined ? [path_data_subscription] : [path_data_subscription, notfiyAboutChangesOfChilds_path_strict, ...paths]) as PathSegment[]
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
      let notfiyAboutChangesOfChilds = (notfiyAboutChangesOfChilds_path_strict === undefined ? true : notfiyAboutChangesOfChilds_path_strict) as boolean
      let subscription = path_data_subscription
      let initialize = paths[0] === undefined ? true : paths[0]

      if (notfiyAboutChangesOfChilds) { 
        if (subscription instanceof DataSubscription) return subscription.activate(false).data(this, initialize)
        else if (this.subscriptionsOfChildChanges.contains(subscription as any)) return subscription[dataSubscriptionCbBridge].activate()
        else return new DataBaseSubscription(this as any, subscription as any, true, notfiyAboutChangesOfChilds, initialize)
      }
      else {
        if (subscription instanceof DataSubscription) return subscription.activate(false).data(this, initialize)
        else if (this.subscriptionsOfThisChanges.contains(subscription as any)) return subscription[dataSubscriptionCbBridge].activate()
        else return new DataBaseSubscription(this as any, subscription as any, true, notfiyAboutChangesOfChilds, initialize)
      }
    }
    else if (path_data_subscription === undefined) {
      return clone(this.store)
    }
    else if (typeof path_data_subscription === objectString) {
      let newData = path_data_subscription as ComplexData
      let strict = notfiyAboutChangesOfChilds_path_strict === undefined ? false : notfiyAboutChangesOfChilds_path_strict

      let parsingId = (paths[0] !== undefined ? paths[0] : Symbol("parsingId")) as any
      
      let handledKeys: string[]

      let notifyFromThis = false

      this.inBulkChange = true
      
      if (strict) handledKeys = []

      for (const key in newData) {
        if (strict) handledKeys.add(key)
        const prop = funcThis[key]
        const newVal = newData[key]
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

                newVal[parsingId] = funcThis[key] = new InternalDataBase(newVal, parsingId, this.boundNotifyFromChild)
                newVal[parsingId][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                  delete newVal[parsingId]
                  delete funcThis[key]
                  delete newData[key]
                  this.notifyFromThis()
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
              // cache all changes comming from below (children) so that only one change event gets emmited
              let db = prop[internalDataBaseBridge]
              db.removeNotifyParentOfChangeCb(this.boundNotifyFromChild)
              db.addNotifyParentOfChangeCb(duringActivationNotificationBundler)
              prop(newVal, parsingId)
              db.removeNotifyParentOfChangeCb(duringActivationNotificationBundler)
              db.addNotifyParentOfChangeCb(this.boundNotifyFromChild)
            }
            else {
              //@ts-ignore
              this.store[key] = newVal
              prop.destroy(this)
              funcThis[key] = new Data(newVal)
              funcThis[key].addBeforeDestroyCb(this, () => {
                
                delete newVal[parsingId]
                delete funcThis[key]
                delete newData[key]
                this.notifyFromThis()
              })
              funcThis[key].get((e) => {
                //@ts-ignore
                this.store[key] = e
                this.notifyFromChild()
              }, false)

              notifyFromThis = true
            }
          }
        }
        else {
          if (typeof newVal === "object") {
            if (newVal[parsingId] === undefined) {
              newVal[parsingId] = funcThis[key] = new InternalDataBase(newVal, parsingId, this.boundNotifyFromChild)
              funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {
                
                delete newVal[parsingId]
                delete funcThis[key]
                delete newData[key]
                this.notifyFromThis()
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
            funcThis[key] = new Data(newVal)
            funcThis[key].addBeforeDestroyCb(this, () => {

              delete newVal[parsingId]
              delete funcThis[key]
              delete newData[key]
              this.notifyFromThis()
            })
            funcThis[key].get((e) => {
              //@ts-ignore
              this.store[key] = e
              this.notifyFromChild()
            }, false)
          }
          notifyFromThis = true
        }
      }

      if (strict) {
        for (const key in funcThis) {
          if (handledKeys.includes(key)) continue

          if (funcThis[key] instanceof Data) funcThis[key].destroy()
          else funcThis[key][internalDataBaseBridge].destroy(this)
        }
      }

      this.inBulkChange = false

      if (notifyFromThis) this.notifyFromThis()

      return funcThis
    }
    
    
    
  }

  private notifyFromChild() {
    this.notifyParentOfChangeCbs.Call()
    //@ts-ignore
    this.subscriptionsOfChildChanges.Call(this.store)
  }

  private inBulkChange: boolean
  private notifyFromThis() {
    if (!this.inBulkChange) {
      this.notifyFromChild()
      //@ts-ignore
      this.subscriptionsOfThisChanges.Call(this.store)
    }
  }

  private initFuncProps(store: Store, parsingId: any) {
    this.store = store
    if (parsingId === undefined) parsingId = Symbol("parsingId")
    const funcThis = this.funcThis
    for (const key in store) {
      const val = store[key] as any
      // TODO: Is this needed or can you just make all functions non iteratable
      if (typeof val !== "function") {
        
        if (typeof val === objectString) {
          if (val[parsingId] === undefined) val[parsingId] = funcThis[key] = new InternalDataBase(val, parsingId, this.boundNotifyFromChild)
          else funcThis[key] = val[parsingId]
          funcThis[key][internalDataBaseBridge].addBeforeDestroyCb(this, () => {

            delete funcThis[key]
            delete store[key]
            this.notifyFromThis()
          })
        }
        else {
          funcThis[key] = new Data(val)
          funcThis[key].addBeforeDestroyCb(this, () => {

            delete funcThis[key]
            delete store[key]
            this.notifyFromThis()
          })
          funcThis[key].get((e) => {
            this.store[key] = e
            this.notifyFromChild()
          }, false)
        }
      }
      
    }
  }


  // ------------
  // Functions for Data**Base**Subscription
  // ------------

  subscribeToChildren(subscription: Subscription<[Readonly<Store>]>, initialize?: boolean): void {
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

  isSubscribed(subscription: Subscription<[Readonly<Store>]>): boolean {
    //@ts-ignore
    return this.subscriptionsOfChildChanges.includes(subscription) || this.subscriptionsOfThisChanges.includes(subscription)
  }

  get(): Store {
    return clone(this.store)
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




type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Record<FunctionProperties, never>
type DataBaseify<Type extends object> = { 
  [Key in keyof Type]: Type[Key] extends object ? DataBase<Type[Key]> : Data<Type[Key]>
}

export type DataBase<Store extends object = any> = (DataBaseify<Store> & OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]>)

//@ts-ignore
export const DataBase = InternalDataBase as ({ new <Store extends object = any>(store: Store): DataBase<Store> })







class DataBaseSubscription<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>> extends DataSubscription<Values> {
  protected _notfiyAboutChangesOfChilds: boolean

  constructor(data: Subscribable<Values>, subscription: Subscription<Values>, activate?: false, notfiyAboutChangesOfChilds?: boolean)
  constructor(data: Subscribable<Values>, subscription: Subscription<Values>, activate?: true, notfiyAboutChangesOfChilds?: boolean, inititalize?: boolean)

  constructor(data: Data<Value>, subscription: Subscription<TupleValue>, activate?: false, notfiyAboutChangesOfChilds?: boolean)
  constructor(data: Data<Value>, subscription: Subscription<TupleValue>, activate?: true, notfiyAboutChangesOfChilds?: boolean, inititalize?: boolean)
  constructor(data: DataCollection<Values>, subscription: Subscription<Values>, activate?: false, notfiyAboutChangesOfChilds?: boolean)
  constructor(data: DataCollection<Values>, subscription: Subscription<Values>, activate?: true, notfiyAboutChangesOfChilds?: boolean, inititalize?: boolean)
  constructor(data: Subscribable<Values> | Data<Value> | DataCollection<Values>, subscription: Subscription<Values> | Subscription<[Values[0]]>, activate: boolean = true, notfiyAboutChangesOfChilds: boolean = true, inititalize?: boolean) {
    //@ts-ignore
    super(data, subscription, false, false)
    this._notfiyAboutChangesOfChilds = notfiyAboutChangesOfChilds

    this.active(activate, inititalize)
  }

  public notfiyAboutChangesOfChilds(): boolean
  public notfiyAboutChangesOfChilds(notfiyAboutChangesOfChilds: boolean): this
  public notfiyAboutChangesOfChilds(notfiyAboutChangesOfChilds?: boolean) {
    if (notfiyAboutChangesOfChilds === undefined) return this._notfiyAboutChangesOfChilds
    
    if (this._notfiyAboutChangesOfChilds !== notfiyAboutChangesOfChilds) {
      this.deacivate()
      this._notfiyAboutChangesOfChilds = notfiyAboutChangesOfChilds
      this.active(false)
    }

    return this
  }

  public activate(initialize: boolean = true): this {  
    if (this.active()) return this;
    if (this._notfiyAboutChangesOfChilds) {
      (this._data as any).subscribeToChildren(this._subscription, initialize)
    }
    else {
      (this._data as any).subscribeToThis(this._subscription, initialize)
    }
    return this
  }

  public deacivate(): this {
    if (!this.active()) return this;
    if (this._notfiyAboutChangesOfChilds) (this._data as any).unsubscribeToChildren(this._subscription)
    else (this._data as any).unsubscribeToThis(this._subscription)
    return this
  }
}


dataDerivativeLiableIndex.set([Data, DataLink])


console.log(DataSubscription)
