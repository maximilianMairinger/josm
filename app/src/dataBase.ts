import { Data, DataSubscription, DataCollection, DataSet, Subscription } from "./data"
import { nthIndex } from "./helper"
import clone from "tiny-clone"
import attatchToPrototype from "attatch-to-prototype"




export class DataBaseLink<Store extends ComplexData> extends Function {
  private t: any
  private db: DataBase<Store>
  constructor(db: DataBase<Store>) {
    super(paramsOfDataBaseLinkFunction, bodyOfDataBaseLinkFunction)
    this.t = this.bind(this)
    this.db = db

    this.attatchDataToFunction()

    return this.t
  }

  private attatchDataToFunction() {
    let attatch = attatchToPrototype(this.t)
    
    for (let key in this.db) {
      attatch(key, { get: () => {
        return this.db[key]
      }, enumerable: true})
    }
  }

  private DataBaseLinkFunction(...a: any[]) {
    this.db(...a)
  }

  private DataBaseLinkFunctionWrapper(...a: any[]) {
    this.DataBaseLinkFunction(...a)
  }
}

//@ts-ignore
const entireDataBaseLinkFunction = DataBaseLink.prototype.DataBaseLinkFunctionWrapper.toString(); 
const paramsOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("(") + 1, nthIndex(entireDataBaseLinkFunction, ")", 1));
const bodyOfDataBaseLinkFunction = entireDataBaseLinkFunction.slice(entireDataBaseLinkFunction.indexOf("{") + 1, entireDataBaseLinkFunction.lastIndexOf("}"));

export class DataLink<Value> {
  constructor(private data: Data<Value>) {

  }

  public get(): Value
  public get(subscription: Subscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription: DataSubscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(...a: any[]) {
    //@ts-ignore
    return this.data.get(...a)
  }

  private isSubscribed(subscription: Subscription<[Value]>) {
    //@ts-ignore
    return this.data.isSubscribed(subscription)
  }
  private unsubscribe(subscription: Subscription<[Value]>) {
    //@ts-ignore
    return this.data.unsubscribe(subscription)
  }
  private subscribe(subscription: Subscription<[Value]>, initialize: boolean) {
    //@ts-ignore
    return this.data.subscribe(subscription, initialize)
  }

  public got(subscription: Subscription<[Value]> | DataSubscription<[Value]>): DataSubscription<[Value]> {
    return this.got(subscription)
  }


  public set(value: Value): Value
  public set(value: Value, wait: false): Value
  public set(value: Value, wait: true): Promise<Value>
  public set(...a: any[]): Value | Promise<Value> {
    //@ts-ignore
    return this.set(...a)
  }

  public toString() {
    return this.data.toString()
  }
}



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
    for (const key in this) {
      //@ts-ignore
      delete this[key]
    }
  }

  private DataBaseFunctionWrapper(...a) {
    return this.DataBaseFunction(...a)
  }


  private DataBaseFunction(...paths: PathSegment[]): any
  private DataBaseFunction<NewStore extends ComplexData>(data: NewStore): DataBase<NewStore & Store>
  private DataBaseFunction(): Store
  private DataBaseFunction(subscription: (store: Store) => void, init: boolean): any
  private DataBaseFunction(path_data_subscription?: PathSegment | ComplexData | ((store: Store) => void), init_path?: PathSegment | boolean, ...paths: PathSegment[]): any {
    const t = this.t

    if (path_data_subscription instanceof Data || path_data_subscription instanceof DataCollection) {

      let erg: any

      let path: PathSegment = path_data_subscription

      if (typeof path === "string" || typeof path === "number") {
        erg = t[path]

      }
      else {
        path.get()
        path.get((path) => {
          erg.
        }, false)
        erg = t[path.get()]

      }


      let link: DataLink<any> | DataBase<any> =  erg instanceof Data ? new DataLink(erg) : new DataBaseLink(erg)
      

      if (init_path === undefined) return erg
      else return erg([init_path, ...paths])
    }
    else if (typeof path_data_subscription === "function") {
      let subscription = path_data_subscription as (store: Store) => void

      if (init_path === undefined || init_path) subscription(this.store)
      this.subscriptions.add(subscription)

    }
    else if (path_data_subscription === undefined) {
      return this.store
    }
    else {
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
              t[key] = new InternalDataBase(val, this.notify)
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
    
  }

  private attatchDataToFunction() {
    const t = this.t
    const data = this.store
    for (const key in data) {
      const val = data[key]
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
}


//@ts-ignore
const entireDataBaseFunction = InternalDataBase.prototype.DataBaseFunctionWrapper.toString(); 
const paramsOfDataBaseFunction = entireDataBaseFunction.slice(entireDataBaseFunction.indexOf("(") + 1, nthIndex(entireDataBaseFunction, ")", 1));
const bodyOfDataBaseFunction = entireDataBaseFunction.slice(entireDataBaseFunction.indexOf("{") + 1, entireDataBaseFunction.lastIndexOf("}"));


const objectString: "object" = "object"


type PrimitivePathSegment = string | number
type PathSegment = PrimitivePathSegment | DataSet<[PrimitivePathSegment]>
type ComplexData = {[key: string]: any}




type FunctionProperties = "apply" | "call" | "caller" | "bind" | "arguments" | "length" | "prototype" | "name" | "toString"
type OmitFunctionProperties<Func extends Function> = Func & Record<FunctionProperties, never>
type DataBaseify<Type extends object> = { 
  [Key in keyof Type]: Type[Key] extends object ? DataBase<Type[Key]> : Data<Type[Key]>
}

type DataBase<Store extends object> = OmitFunctionProperties<InternalDataBase<Store>["DataBaseFunction"]> & DataBaseify<Store>

//@ts-ignore
export const DataBase = InternalDataBase as ({ new<Store extends object>(store: Store): DataBase<Store> })

