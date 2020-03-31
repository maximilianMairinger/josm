import { Data, DataSubscription, DataCollection, Subscription, DataSet } from "./data"
import { nthIndex } from "./helper"
import clone from "tiny-clone"
import attatchToPrototype from "attatch-to-prototype"




//@ts-ignore
const entireDataBaseLinkFunction = DataBaseLink.prototype.DataBaseLinkFunctionWrapper.toString(); 
const paramsOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("(") + 1, nthIndex(entireDataBaseLinkFunction, ")", 1));
const bodyOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("{") + 1, entireDataBaseLinkFunction.lastIndexOf("}"));

export class Link<Value> {
  private value: Value extends object ? Data<Value> | DataBase<Value> : Data<Value>
  private home: any

  private subscriptions: DataSubscription<PathSegment[]>[] = []

  destroy() {
    this.subscriptions.ea((subscription) => {
      subscription.deacivate()
    })
    this.home.destroy()
    for (let iterator in this) {
      delete this[iterator]
    }
  }

  constructor(private wrapper: DataBase<{[key: string]: Value}>, paths: PathSegment[]) {
    this.home = wrapper

    let currentPathIndex: (string | number)[] = []


    let change = (at: number, parent: any) => {

    }

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      let top = currentPathIndex.length
      
      
      if (typeof path === "number" || typeof path === "string") {
        currentPathIndex[top] = path
      }
      else {

        let me = path.get((...a) => {
          let maTop = top
          let lastFine = maTop - 1

          let mayBeFirstChange = a.ea((e) => {
            if (currentPathIndex[maTop] !== e) return maTop
            maTop++
          })
          if (mayBeFirstChange !== undefined) lastFine = mayBeFirstChange - 1

          let prevVal = currentPathIndex[lastFine] === undefined ? wrapper : currentPathIndex[lastFine] 
          let firstChange = lastFine + 1

          maTop = firstChange
          for (let i = firstChange - top; i < a.length; i++) {
            const e = a[i];

            currentPathIndex[maTop] = e

            maTop++
          }


          change(firstChange, prevVal)
        })


        this.subscriptions.add(me)

      }
    }

    change = (at: number, parent: any) => {
      for (; at < currentPathIndex.length; at++) {
        const path = currentPathIndex[at];
        parent = parent[path]
      }
      this.value = parent

      //@ts-ignore
      if (this.value instanceof DataBase) this.home = this.value[internalDataBaseBridge]
      //@ts-ignore
      else this.home = this.value
    }

    change(0, wrapper)
    
  }

  public get(): Value
  public get(subscription: Subscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription: DataSubscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(...a: any[]) {
    //@ts-ignore
    return this.home.get(...a)
  }

  private isSubscribed(subscription: Subscription<[Value]>) {
    //@ts-ignore
    return this.home.isSubscribed(subscription)
  }
  private unsubscribe(subscription: Subscription<[Value]>) {
    //@ts-ignore
    return this.home.unsubscribe(subscription)
  }
  private subscribe(subscription: Subscription<[Value]>, initialize: boolean) {
    //@ts-ignore
    return this.home.subscribe(subscription, initialize)
  }

  public got(subscription: Subscription<[Value]> | DataSubscription<[Value]>): DataSubscription<[Value]> {
    return this.home.got(subscription)
  }


  public set(value: Value): Value
  public set(value: Value, wait: false): Value
  public set(value: Value, wait: true): Promise<Value>
  public set(...a: any[]): Value | Promise<Value> {
    //@ts-ignore
    return this.home.set(...a)
  }

  public toString() {
    return this.home.toString()
  }
}


let internalDataBaseBridge = Symbol("InternalDataBaseBridge")


class InternalDataBase<Store extends ComplexData> extends Function {
  private t: any

  private store: Store
  private hasNotifyParentOfChange: boolean

  constructor(store: Store, private notifyParentOfChange?: () => void) {
    super(paramsOfDataBaseFunction, bodyOfDataBaseFunction)
    this.t = this.bind(this)

    this.store = store
    this.hasNotifyParentOfChange = notifyParentOfChange !== undefined
    this.notify = this.notify.bind(this)
    this.subscriptions = []

    
    this.attatchDataToFunction()
    

    this.t[internalDataBaseBridge] = this
    return this.t
  }
  private subscriptions: ((store: Store) => void)[]
  private notify() {
    if (this.hasNotifyParentOfChange) this.notifyParentOfChange()
    this.subscriptions.Call(this.store)
  }

  private destroy() {
    for (const key in this.t) {
      this.t[key].destory()
      delete this.t[key]
    }
    for (let i = 0; i < this.distributedLinks.length; i++) {
      this.distributedLinks[i].destroy()
      delete this.distributedLinks[i]
      
    }
    for (const key in this) {
      //@ts-ignore
      delete this[key]
    }
  }

  private DataBaseFunctionWrapper(...a) {
    return this.DataBaseFunction(...a)
  }

  private distributedLinks: Link<any>[] = []


  private DataBaseFunction(...paths: PathSegment[]): any
  private DataBaseFunction<NewStore extends ComplexData>(data: NewStore): DataBase<NewStore & Store>
  private DataBaseFunction(): Store
  private DataBaseFunction(subscription: ((store: Store) => void) | DataSubscription<[Store]>, init: boolean): DataSubscription<[Store]>
  private DataBaseFunction(path_data_subscription?: PathSegment | ComplexData | ((store: Store) => void), init_path?: PathSegment | boolean, ...paths: PathSegment[]): any {
    const t = this.t

    if (path_data_subscription instanceof Data || path_data_subscription instanceof DataCollection) {
      let link = new Link<any>(t, init_path === undefined ? [path_data_subscription] : [path_data_subscription, init_path, ...paths] as PathSegment[]) as any
      this.distributedLinks.add(link)
      return link
    }
    else if (typeof path_data_subscription === "function" || path_data_subscription instanceof DataSubscription) {
      if (path_data_subscription instanceof DataSubscription) {
        return path_data_subscription.active() ? path_data_subscription.deacivate() : path_data_subscription.activate()
      }
      else {
        //@ts-ignore
        return this.subscriptions.includes(path_data_subscription) ? new DataSubscription(this, path_data_subscription, false) : new DataSubscription(this, path_data_subscription, true, init_path)
      }
    }
    else if (path_data_subscription === undefined) {
      return this.store
    }
    else if (typeof path_data_subscription === "object") {
      let data = path_data_subscription as ComplexData
      
      

      for (const key in data) {
        const inner = t[key]
        const val = data[key]
        if (inner !== undefined) {
          if (inner instanceof Data) {
            if (typeof val !== "object") {
              //@ts-ignore
              this.store[key] = val
              inner.set(val)
            }
            else {
              //@ts-ignore
              this.store[key] = clone(val)
              (inner as any).destory()
              t[key] = new InternalDataBase(val, this.notify.bind(this))
            }
          }
          else {
            if (typeof val === "object") inner(val)
            else {
              //@ts-ignore
              this.store[key] = clone(val)
              (inner as any).destory()
              t[key] = new Data(val)
              t[key].get((e) => {
                //@ts-ignore
                this.store[key] = e
                this.notify()
              })
            }
          }
        }
        else {
          if (typeof val === "object") {
            t[key] = new InternalDataBase(val, this.notify)
            //@ts-ignore
            this.store[key] = clone(val)
          }
          else {
            //@ts-ignore
            this.store[key] = val
            t[key] = new Data(val)
            t[key].get((e) => {
              //@ts-ignore
              this.store[key] = e
              this.notify()
            })
          }
        }
      }
      return t
    }
    else if (typeof path_data_subscription === "string" || typeof path_data_subscription === "number") {
      if (init_path === undefined) return this[path_data_subscription]
      else {
        let ret = this
        for (let path of [path_data_subscription, init_path, ...paths]) {
          //@ts-ignore
          ret = ret[path]
        }
        return ret
      }
    }
    
    
  }

  private attatchDataToFunction() {
    const t = this.t
    const data = this.store
    for (const key in data) {
      const val = data[key] as any
      if (!(val instanceof Data || val instanceof InternalDataBase)) {
        if (typeof val === objectString) t[key] = new InternalDataBase(val, this.notify)
        else {
          t[key] = new Data(val)
          t[key].get((e) => {
            this.store[key] = e
            this.notify()
          })

        }
      }
    }
  }


  // ------------
  // Functions for DataSubscription
  // ------------

  subscribe(subscription: Subscription<[Store]>, initialize?: boolean): void {
    if (initialize === undefined || initialize) subscription(this.store)
    this.subscriptions.add(subscription)
  }

  unsubscribe(subscription: Subscription<[Store]>): void {
    this.subscriptions.rmV(subscription)
  }

  isSubscribed(subscription: Subscription<[Store]>): boolean {
    return this.subscriptions.includes(subscription)
  }

  get(): Store {
    return this.store
  }

}


//@ts-ignore
const entireDataBaseFunction = InternalDataBase.prototype.DataBaseFunctionWrapper.toString(); 
const paramsOfDataBaseFunction = entireDataBaseFunction.slice(entireDataBaseFunction.indexOf("(") + 1, nthIndex(entireDataBaseFunction, ")", 1));
const bodyOfDataBaseFunction = entireDataBaseFunction.slice(entireDataBaseFunction.indexOf("{") + 1, entireDataBaseFunction.lastIndexOf("}"));


const objectString: "object" = "object"


type PrimitivePathSegment = string | number
type PathSegment = PrimitivePathSegment | DataSet<PrimitivePathSegment[]>
type ComplexData = {[key: string]: any}




type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Record<FunctionProperties, never>
type DataBaseify<Type extends object> = { 
  [Key in keyof Type]: Type[Key] extends object ? DataBase<Type[Key]> : Data<Type[Key]>
}

export type DataBase<Store extends object> = OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]> & DataBaseify<Store>

//@ts-ignore
export const DataBase = InternalDataBase as ({ new<Store extends object>(store: Store): DataBase<Store> })

