// Those are just types, thus can be collected by  
// dead code detection & omited for treeshaking
import { Concat } from 'typescript-tuple'
import { DataBase } from './josm'
import clone from "fast-copy"

import { circularDeepEqual } from "fast-equals"

import Xrray from "xrray"
import { dataDerivativeLiableIndex } from './derivativeExtention'
import constructAttatchToPrototype from 'attatch-to-prototype'
Xrray(Array)

export const localSubscriptionNamespace = {
  register: (me: {destroy: () => void}) => {

  }
}


export type Subscription<Values extends any[]> = (...value: Values) => void | Promise<void>



export class Data<Value = unknown> {
  private subscriptions: Subscription<[Value]>[] = []
  private linksOfMe = []

  private locSubNsReg: {destroy: () => void}[] = []

  public constructor(private value?: Value) {}

  
  public get(): Value
  public get(subscription: Subscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription: DataSubscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription?: Subscription<[Value]> | DataSubscription<[Value]>, initialize: boolean = true): Value | DataSubscription<[Value]> {
    if (subscription === undefined) return this.value
    else {
      if (subscription instanceof DataSubscription) return subscription.activate(false).data(this, initialize)
      else if (this.subscriptions.includes(subscription)) return subscription[dataSubscriptionCbBridge].activate()
      //@ts-ignore
      else return new DataSubscription(this, subscription, true, initialize)
    }
  }


  // Return false when not successfull; dont throw (maybe in general Xrray)
  public got(subscription: Subscription<[Value]> | DataSubscription<[Value]>): DataSubscription<[Value]> {
    return (subscription instanceof DataSubscription) ? subscription.deactivate()
    : subscription[dataSubscriptionCbBridge].deacivate()
  }
  

  // Datas can only have one parent, thus there is no need to keep track of them. From is just there to match the syntax of InternalDataBase
  private beforeDestroyCbs = []
  private addBeforeDestroyCb(from: any, cb: () => void) {
    this.beforeDestroyCbs.add(cb)
  }

  private destroy() {
    this.beforeDestroyCbs.Call()
    this.beforeDestroyCbs.clear()
    this.linksOfMe.Inner("destroy", [])
    this.linksOfMe.clear()
    for (const key in this) {
      delete this[key]
    }
  }

  public set(value: Value): Value
  public set(value: Value): Value {
    if (value === this.value) return value
    this.value = value

    this.locSubNsReg.Inner("destroy", [])

    let last = localSubscriptionNamespace.register
    localSubscriptionNamespace.register = (me) => {
      this.locSubNsReg.add(me)
    }


    for (let subscription of this.subscriptions) {
      subscription(value)
    }

    localSubscriptionNamespace.register = last

    return value
  }

  protected isSubscribed(subscription: Subscription<[Value]>) {}
  protected subscribeToThis(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected subscribeToChildren(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected unsubscribeToThis(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected unsubscribeToChildren(subscription: Subscription<[Value]>, initialize: boolean) {}

  public toString() {
    return "Data: " + this.value
  }
}

dataDerivativeLiableIndex.set([Data])

// Why this works is an absolute mirracle to me...
// In typescript@3.8.3 recursive generics are to the best of my knowledge not possible (and do not seem to be of highest priority to the ts devs), but somehow it works like this
export type FuckedUpDataSet<Values extends any[]> = Data<Values[0]> | DataCollection<Values[number]>





export type FuckedUpDataSetify<T extends any[]> = { 
  [P in keyof T]: FuckedUpDataSet<[T[P]]>
}


export class DataCollection<Values extends any[] = unknown[], Value extends Values[number] = Values[number]> {
  private subscriptions: Subscription<Values>[] = []
  //@ts-ignore
  private datas: FuckedUpDataSetify<Values> = []
  private store: Values

  private observers: Subscription<[Value]>[] = []

  constructor(...datas: FuckedUpDataSetify<Values>) {
    //@ts-ignore
    this.set(...datas)
  }

  public set(...datas: FuckedUpDataSetify<Values>) {
    this.datas.ea((data, i) => {
      data.got(this.observers[i])
    })
    this.observers.clear()

    this.datas = datas
    //@ts-ignore
    this.store = [...this.get()]


    this.datas.ea((data, i) => {
      const observer = (...val: Value[]) => {
        if (this.store[i] instanceof Array) this.store[i] = val
        else this.store[i] = val.first
        this.subscriptions.Call(...this.store)
      }
      this.observers[i] = observer
      //@ts-ignore
      data.subscribe(observer, false)
    })
  }

  public get(): Values
  public get(subscription: Subscription<Values> | DataSubscription<Values>, initialize?: boolean): DataSubscription<Values>
  public get(subscription?: Subscription<Values> | DataSubscription<Values>, initialize: boolean = true): DataSubscription<Values> | Values {
    //@ts-ignore
    if (subscription === undefined) return this.datas.Inner("get", [])
    else {
      if (subscription instanceof DataSubscription) return subscription.activate(false).data(this, initialize)
      else if (this.subscriptions.includes(subscription)) return subscription[dataSubscriptionCbBridge].activate()
      else return new DataSubscription(this, subscription, true, initialize)
    }
  }
  public got(subscription: Subscription<Values> | DataSubscription<Values>): DataSubscription<Values> {
    return (subscription instanceof DataSubscription) ? subscription.deactivate()
    : new DataSubscription(this, subscription, false)
  }

} 

const attach = constructAttatchToPrototype([Data, DataCollection].inner("prototype"))


attach("isSubscribed", function(subscription: any) {
  return this.subscriptions.includes(subscription)
})

attach(["unsubscribeToThis", "unsubscribeToChildren"], function(subscription: any) {
  return this.subscriptions.includes(subscription)
})

attach(["subscribeToThis", "subscribeToChildren"], function(subscription: any, initialize: any) {
  this.subscriptions.add(subscription)
  if (initialize) {
    let last = localSubscriptionNamespace.register
    localSubscriptionNamespace.register = (me) => {
      this.locSubNsReg.add(me)
    }
    subscription(this.value)
    localSubscriptionNamespace.register = last
  }
})



//@ts-ignore
export type DataSet<Values extends any[], DataOrDataCol extends Values[0] | Values = Values[0] | Values, DataOrDataColTuple extends Concat<[Values[0]], OptionalifyTuple<Tail<Values>>> | Values = Concat<[Values[0]], OptionalifyTuple<Tail<Values>>> | Values> = {
  get(): DataOrDataCol
  get(subscription: Subscription<DataOrDataColTuple> | DataSubscription<DataOrDataColTuple>, initialize?: boolean): DataSubscription<DataOrDataColTuple>
}

type FnWithArgs<T extends unknown[]> = (...args: T) => void;
type TailArgs<T> = T extends (x: unknown, ...args: infer T) => unknown ? T : never;
type Tail<T extends unknown[]> = TailArgs<FnWithArgs<T>>;

type OptionalifyTuple<Tuple extends any[]> = {
  [key in keyof Tuple]?: Tuple[key]
}


type ProperSubscribable<Values extends any[]> = {subscribeToThis: (subscription: Subscription<Values>, initialize?: boolean) => void, subscribeToChildren: (subscription: Subscription<Values>, initialize?: boolean) => void, unsubscribeToThis: (subscription: Subscription<Values>) => void, unsubscribeToChildren: (subscription: Subscription<Values>) => void, get: () => Values, isSubscribed: (subscription: Subscription<Values>) => boolean}
export type Subscribable<Values extends any[]> = ProperSubscribable<Values> | FuckedUpDataSet<Values> | DataBase<Values[0]>


export const dataSubscriptionCbBridge = Symbol("dataSubscriptionCbBridge")

export class DataBaseSubscription<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>> {
  private _notfiyAboutChangesOfChilds: boolean

  private _subscription: ConcreteSubscription
  private _data: ConcreteData


  constructor(data: Subscribable<Values>, subscription: Subscription<Values>, activate?: false)
  constructor(data: Subscribable<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean)

  constructor(data: Data<Value>, subscription: Subscription<TupleValue>, activate?: false)
  constructor(data: Data<Value>, subscription: Subscription<TupleValue>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean)

  constructor(data: DataCollection<Values>, subscription: Subscription<Values>, activate?: false)
  constructor(data: DataCollection<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean)

  constructor(data: Subscribable<Values> | Data<Value> | DataCollection<Values>, subscription?: Subscription<Values> | Subscription<[Values[0]]>, activate: boolean = true, inititalize?: boolean, notfiyAboutChangesOfChilds: boolean = true) {
    //@ts-ignore
    this._data = data
    //@ts-ignore
    this._subscription = subscription
    this._notfiyAboutChangesOfChilds = notfiyAboutChangesOfChilds
    subscription[dataSubscriptionCbBridge] = this

    localSubscriptionNamespace.register(this as any)
    this.active(activate, inititalize)

  }

  public active(): boolean
  public active(activate: false): this
  public active(activate: true, initialize?: boolean): this
  public active(activate: boolean, initialize?: boolean): this
  public active(activate?: boolean, initialize: boolean = true): this | boolean {
    if (activate === undefined) return (this._data as ProperSubscribable<Values>).isSubscribed(this._subscription)
    if (activate) this.activate(initialize)
    else this.deacivate()
    return this
  }

  private destroy() {
    this.deacivate()

    for (let key in this) {
      delete this[key]
    }
  }

  
  public data(): ConcreteData
  public data(data: ConcreteData, initialize?: boolean): this
  public data(data?: ConcreteData, initialize: boolean = true): ConcreteData | this {
    if (data === undefined) return this._data
    else {
      if (this._data !== data) {
        let isActive = this.active()
        let prevData: any
        if (initialize) prevData = clone((this._data as ProperSubscribable<Values>).get())
        this.deacivate()
        this._data = data
        if (isActive) this.activate(initialize && (!circularDeepEqual(prevData, (data as ProperSubscribable<Values>).get())))
      }
      return this
    }
  }
  
  public subscription(): ConcreteSubscription
  public subscription(subscription: ConcreteSubscription, initialize?: boolean): this
  public subscription(subscription?: ConcreteSubscription, initialize?: boolean): ConcreteSubscription | this {
    if (subscription === undefined) return this._subscription
    else {
      if (subscription === this._subscription) return this
      let isActive = this.active()
      this.deacivate()
      this._subscription = subscription
      subscription[dataSubscriptionCbBridge] = this
      if (isActive) this.activate(initialize)
      return this
    }
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



export interface DataSubscription<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>> {

  deactivate(): this

  activate(initialize?: boolean): this

  subscription(): ConcreteSubscription
  subscription(subscription: ConcreteSubscription, initialize?: boolean): this

  data(): ConcreteData
  data(data: ConcreteData, initialize?: boolean): this

  active(): boolean
  active(activate: false): this
  active(activate: true, initialize?: boolean): this
  active(activate: boolean, initialize?: boolean): this
}


//@ts-ignore
export const DataSubscription = DataBaseSubscription as ({ 
  new <Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Subscribable<Values>, subscription: Subscription<Values>, activate?: false): DataSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription> 

  new <Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Subscribable<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean): DataSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription> 


  new <Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Data<Value>, subscription: Subscription<TupleValue>, activate?: false): DataSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription> 

  new <Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Data<Value>, subscription: Subscription<TupleValue>, activate?: true, inititalize?: boolean): DataSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription> 


  new <Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: DataCollection<Values>, subscription: Subscription<Values>, activate?: false): DataSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription> 

  new <Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: DataCollection<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean): DataSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription> 
})

