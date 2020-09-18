// Those are just types, thus can be collected by  
// dead code detection & omited for treeshaking
import { Concat } from 'typescript-tuple'
import { DataBase } from './josm'
import clone from "fast-copy"
import { DataCollection } from "./dataCollection"

import xrray from "xrray"
xrray(Array)
import xtring from "xtring"
xtring()

import { circularDeepEqual } from "fast-equals"


import { dataDerivativeLiableIndex } from './derivativeExtension'
import constructAttatchToPrototype from 'attatch-to-prototype'


export const localSubscriptionNamespace = {
  register: (me: {destroy: () => void}) => {

  }
}


export type Subscription<Values extends any[]> = (...value: Values) => void


export const justInheritanceFlag = Symbol("justInheritanceFlag")
export const tunnelSubscription = Symbol("tunnelSubscription")
export class Data<Value = unknown, Default extends Value = Value> {
  private subscriptions: Subscription<[Value]>[]
  protected linksOfMe: any[]

  private locSubNsReg: { destroy: () => void }[]
  protected value: Value

  public constructor(value?: Value, private Default?: Default) {
    if (value !== justInheritanceFlag as any) {
      this.linksOfMe = []
      this.subscriptions = []
      this.locSubNsReg = []
      this.set(value)
    }
  }

  protected __call(subs: Subscription<[Value]>[]) {
    subs.Call(this.value)
  }

  public tunnel<Ret>(func: (val: Value) => Ret): Data<Ret> {
    let d: Data<Ret> = new Data()
    d[tunnelSubscription] = this.get((val) => {
      d.set(func(val))
    })
    return d
  }
  
  public get(): Value
  public get(subscription: Subscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription: DataSubscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription?: Subscription<[Value]> | DataSubscription<[Value]>, initialize: boolean = true): Value | DataSubscription<[Value]> {
    if (subscription === undefined) return this.value
    else {
      if (subscription instanceof DataSubscription) return subscription.activate(false).data(this, false).call(initialize)
      else if (this.isSubscribed(subscription)) return subscription[dataSubscriptionCbBridge]
      //@ts-ignore
      else return new DataSubscription(this, subscription, true, initialize)
    }
  }


  // Return false when not successfull; dont throw (maybe in general Xrray)
  public got(subscription: Subscription<[Value]> | DataSubscription<[Value]>): DataSubscription<[Value]> {
    return (subscription instanceof DataSubscription) ? subscription.deactivate()
    : subscription[dataSubscriptionCbBridge].deactivate()
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
    this.locSubNsReg.Inner("destroy", [])
    this.locSubNsReg.clear()
    for (const key in this) {
      delete this[key]
    }
  }

  public set(value: Value): Value {
    value = value !== undefined ? value : this.Default
    if (value === this.value) return value
    this.value = value
    this.call()
    return value
  }

  public valueOf() {
    return this.get()
  }

  //@ts-ignore
  protected isSubscribed(subscription: Subscription<[Value]>): boolean {}
  protected subscribeToThis(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected subscribeToChildren(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected unsubscribeToThis(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected unsubscribeToChildren(subscription: Subscription<[Value]>, initialize: boolean) {}
  protected call(...subscription: Subscription<[Value]>[]) {}

  public toString() {
    return "Data: " + this.value
  }
}

// Why this works is an absolute mirracle to me...
// In typescript@3.8.3 recursive generics are to the best of my knowledge not possible (and do not seem to be of highest priority to the ts devs), but somehow it works like this
export type FuckedUpDataSet<Values extends any[]> = Data<Values[0]> | DataCollection<Values[number]>





export type FuckedUpDataSetify<T extends any[]> = { 
  [P in keyof T]: FuckedUpDataSet<[T[P]]>
}


function isSubscribed(subscription: any) {
  return this.subscriptions.includes(subscription)
}

function unsubscribe(subscription: any) {
  this.subscriptions.rmV(subscription)
}

function subscribe(subscription: any, initialize: any) {
  this.subscriptions.add(subscription)
  if (initialize) this.call(subscription)
}

function call(s: any) {
  let { subs, need } = needFallbackForSubs(s)
  if (need) subs = this.subscriptions
  registerSubscriptionNamespace(() => {
    this.__call(subs)
  }, this.locSubNsReg)
}


export function registerSubscriptionNamespace(go: () => void, locSubNsReg: any[]) {
  locSubNsReg.Inner("destroy", [])
  locSubNsReg.clear()

  let last = localSubscriptionNamespace.register
  localSubscriptionNamespace.register = (me) => {
    locSubNsReg.add(me)
  }
  go()
  localSubscriptionNamespace.register = last
}

export function needFallbackForSubs(subs: any) {
  let need = false
  if (subs !== undefined) {
    if (!(subs instanceof Array)) subs = [subs]
    else if (subs.empty) need = true
  }
  else need = true
  return {subs, need}
}


export function attachSubscribableMixin(to: any) {
  const attach = constructAttatchToPrototype(to.prototype)

  attach("call", call)
  attach("isSubscribed", isSubscribed)
  attach(["unsubscribeToThis", "unsubscribeToChildren", "unsubscribe"], unsubscribe)
  attach(["subscribeToThis", "subscribeToChildren", "subscribe"], subscribe)
}

attachSubscribableMixin(Data)




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


type ProperSubscribable<Values extends any[]> = {subscribeToThis: (subscription: Subscription<Values>, initialize?: boolean) => void, subscribeToChildren: (subscription: Subscription<Values>, initialize?: boolean) => void, unsubscribeToThis: (subscription: Subscription<Values>) => void, unsubscribeToChildren: (subscription: Subscription<Values>) => void, get: () => Values, isSubscribed: (subscription: Subscription<Values>) => boolean, call: (subscription?: Subscription<Values>[] | Subscription<Values>, notifyChilds?: boolean) => void}
export type Subscribable<Values extends any[]> = ProperSubscribable<Values> | FuckedUpDataSet<Values> | DataBase<Values[0]>


export const dataSubscriptionCbBridge = Symbol("dataSubscriptionCbBridge")

export class DataBaseSubscription<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>> {
  private _notifyAboutChangesOfChilds: boolean

  private _subscription: ConcreteSubscription
  private _data: ConcreteData


  constructor(data: Subscribable<Values>, subscription: Subscription<Values>, activate?: false)
  constructor(data: Subscribable<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean)

  constructor(data: Data<Value>, subscription: Subscription<TupleValue>, activate?: false)
  constructor(data: Data<Value>, subscription: Subscription<TupleValue>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean)

  constructor(data: DataCollection<Values>, subscription: Subscription<Values>, activate?: false)
  constructor(data: DataCollection<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean)

  constructor(data: Subscribable<Values> | Data<Value> | DataCollection<Values>, subscription?: Subscription<Values> | Subscription<[Values[0]]>, activate: boolean = true, initialize?: boolean, notfiyAboutChangesOfChilds: boolean = true) {
    //@ts-ignore
    this._data = data
    //@ts-ignore
    this._subscription = subscription
    this._notifyAboutChangesOfChilds = notfiyAboutChangesOfChilds
    subscription[dataSubscriptionCbBridge] = this

    localSubscriptionNamespace.register(this as any)
    this.active(activate as any, initialize)
  }

  public active(): boolean
  public active(activate: false): this
  public active(activate: true, initialize?: boolean): this
  public active(activate?: boolean, initialize: boolean = true): this | boolean {
    if (activate === undefined) return (this._data as ProperSubscribable<Values>).isSubscribed(this._subscription)
    if (activate) this.activate(initialize)
    else this.deactivate()
    return this
  }

  public call(sure = true) {
    if (sure) (this._data as any).call(this._subscription, this._notifyAboutChangesOfChilds)
    return this
  }

  private destroy() {
    this.deactivate()

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
        this.deactivate()
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
      this.deactivate()
      delete this._subscription[dataSubscriptionCbBridge]
      this._subscription = subscription
      subscription[dataSubscriptionCbBridge] = this
      if (isActive) this.activate(initialize)
      return this
    }
  }

  public notfiyAboutChangesOfChilds(): boolean
  public notfiyAboutChangesOfChilds(notfiyAboutChangesOfChilds: boolean): this
  public notfiyAboutChangesOfChilds(notfiyAboutChangesOfChilds?: boolean) {
    if (notfiyAboutChangesOfChilds === undefined) return this._notifyAboutChangesOfChilds
    
    if (this._notifyAboutChangesOfChilds !== notfiyAboutChangesOfChilds) {
      this.deactivate()
      this._notifyAboutChangesOfChilds = notfiyAboutChangesOfChilds
      // TODO: check if there is a diff, when yes we must initialize
      this.active(false)
    }

    return this
  }

  public activate(initialize: boolean = true): this {  
    if (this.active()) return this;
    if (this._notifyAboutChangesOfChilds) {
      (this._data as any).subscribeToChildren(this._subscription, initialize)
    }
    else {
      (this._data as any).subscribeToThis(this._subscription, initialize)
    }
    return this
  }

  public deactivate(): this {
    if (!this.active()) return this;
    if (this._notifyAboutChangesOfChilds) (this._data as any).unsubscribeToChildren(this._subscription)
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

  call(sure?: boolean): this
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

