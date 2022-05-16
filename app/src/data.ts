// Those are just types, thus can be collected by  
// dead code detection & omited for treeshaking
import { Concat } from 'typescript-tuple'
import { DataBase } from './josm'
import { DataCollection } from "./dataCollection"
import keyIndex from "key-index"
import LinkedList, { Token } from "fast-linked-list"

import xrray from "xrray"
xrray(Array)
import xtring from "xtring"
xtring()

import { circularDeepEqual } from "fast-equals"


import { dataDerivativeLiableIndex } from './derivativeExtension'
import constructAttatchToPrototype from 'attatch-to-prototype'
import cloneKeysButKeepSym from './lib/clone'


// record???
export const localSubscriptionNamespace = {
  register: (me: {destroy: () => void, _data: any}) => {

  },
  dont: (that: any) => {

  }
}


export type Subscription<Values extends any[]> = (...value: Values) => void


export const justInheritanceFlag = Symbol("justInheritanceFlag")
export const tunnelSubscription = Symbol("tunnelSubscription")
export class Data<Value = unknown, _Default extends Value = Value> {
  private subscriptions: LinkedList<Subscription<[Value]>>
  protected linksOfMe: any[]

  private locSubNsReg: { destroy: () => void }[]
  protected value: Value

  public constructor(value?: Value, private _default?: _Default) {
    if (value !== justInheritanceFlag as any) {
      localSubscriptionNamespace.dont(this)
      this.linksOfMe = []
      this.subscriptions = new LinkedList()
      this.locSubNsReg = []
      this.set(value)
    }
  }

  protected __call(subs: LinkedList<Subscription<[Value]>>) {
    const v = this.value
    for (const s of subs) {
      s(v)
    }
  }

  public tunnel<Ret, Dat extends Data<Ret>>(func: (val: Value) => Ret, init: boolean | undefined, useThisConstructor: {new(...a: any[]): Dat}): Dat
  public tunnel<Ret>(func: (val: Value) => Ret, init: boolean | undefined, useThisConstructor: true): this extends Data<Ret> ? this : Data<Ret>
  public tunnel<Ret>(func: (val: Value) => Ret, init?: boolean, useThisConstructor?: boolean): Data<Ret>
  public tunnel<Ret>(func: (val: Value) => Ret, init?: boolean, useThisConstructor: boolean | {new(...a: any[]): Data<any>} = false) {
    let d = (new (!useThisConstructor ? Data : (useThisConstructor === true ? (this as any).constructor as any : useThisConstructor as any))) as this
    d[tunnelSubscription] = this.get((val) => {
      d.set((func as any)(val))
    }, init)
    return d as any
  }
  
  public get(): Value
  public get(subscription: Subscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription: DataSubscription<[Value]>, initialize?: boolean): DataSubscription<[Value]>
  public get(subscription?: Subscription<[Value]> | DataSubscription<[Value]>, initialize: boolean = true): Value | DataSubscription<[Value]> {
    if (subscription === undefined) return this.value
    else {
      if (subscription instanceof DataSubscription) return subscription.data(this, false).activate(initialize)
      else if (subscription[dataSubscriptionCbBridge]) return subscription[dataSubscriptionCbBridge].data(this, false).activate(initialize)
      //@ts-ignore
      else return new DataSubscription(this, subscription, true, initialize)
    }
  }


  // TODO: Return false when not successfull; dont throw (maybe in general Xrray)
  public got(subscription: Subscription<[Value]> | DataSubscription<[Value]>): DataSubscription<[Value]> {
    return (subscription instanceof DataSubscription) ? subscription.deactivate()
    : subscription[dataSubscriptionCbBridge].deactivate()
  }
  

  // Datas can only have one parent, thus there is no need to keep track of them. From is just there to match the syntax of InternalDataBase
  private beforeDestroyCbs = []
  private addBeforeDestroyCb(from: any, cb: () => void) {
    this.beforeDestroyCbs.push(cb)
  }

  protected destroy() {
    this.set(undefined)
    for (const f of this.beforeDestroyCbs) f()
    this.beforeDestroyCbs.clear()
    for (const e of this.linksOfMe) e.destroy()
    this.linksOfMe.clear()
    for (const e of this.locSubNsReg) e.destroy()
    this.locSubNsReg.clear()
    this.subscriptions.clear()
  }

  public set(value: Value): Value {
    value = value !== undefined ? value : this._default
    if (value === this.value) return value
    this.value = value
    this.call()
    return value
  }

  public valueOf() {
    return this.get()
  }

  protected subscribeToThis?(subscription: Subscription<[Value]>, initialize: boolean): Token<Subscription<[Value]>>
  protected subscribeToChildren?(subscription: Subscription<[Value]>, initialize: boolean): Token<Subscription<[Value]>>
  protected unsubscribe?(tok: Token<Subscription<[Value]>>): void
  protected call?(...subscription: Subscription<[Value]>[]): void

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



function unsubscribe(subscriptionToken: Token<any>) {
  subscriptionToken.value[subscriptionDiffSymbol] = cloneKeysButKeepSym(this.get())
  subscriptionToken.rm()
  
  // (this.subscriptions as LinkedList<any>)
}

function subscribe(subscription: any, initialize: any) {
  const tok = this.subscriptions.push(subscription)
  if (initialize) this.call(subscription)
  return tok
}

function call(s: any) {
  let { subs, need } = needFallbackForSubs(s)
  if (need) subs = this.subscriptions
  registerSubscriptionNamespace(() => {
    this.__call(subs)
  }, this.locSubNsReg)
}


export function registerSubscriptionNamespace(go: () => void, locSubNsReg: any[]) {
  for (const e of locSubNsReg) e.destroy()
  locSubNsReg.clear()

  let dont = []

  let lastReg = localSubscriptionNamespace.register
  let lastDont = localSubscriptionNamespace.dont
  localSubscriptionNamespace.register = (me) => {
    if (!dont.includes(me._data)) locSubNsReg.push(me)
  }
  localSubscriptionNamespace.dont = (that) => {
    dont.push(that)
  }
  go()
  localSubscriptionNamespace.register = lastReg
  localSubscriptionNamespace.dont = lastDont
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
  attach("unsubscribe", unsubscribe)
  attach(["subscribeToThis", "subscribeToChildren", "subscribe"], subscribe)
}

attachSubscribableMixin(Data)




//@ts-ignore
export type DataSet<Values extends any[], DataOrDataCol extends Values[0] | Values = Values[0] | Values, DataOrDataColTuple extends Concat<[Values[0]], OptionalifyTuple<Tail<Values>>> | Values = Concat<[Values[0]], OptionalifyTuple<Tail<Values>>> | Values> = {
  get(): DataOrDataCol
  // TODO: Fix types
  //@ts-ignore
  get(subscription: Subscription<DataOrDataColTuple> | DataSubscription<DataOrDataColTuple>, initialize?: boolean): DataSubscription<DataOrDataColTuple>
}

type FnWithArgs<T extends unknown[]> = (...args: T) => void;
type TailArgs<T> = T extends (x: unknown, ...args: infer T) => unknown ? T : never;
type Tail<T extends unknown[]> = TailArgs<FnWithArgs<T>>;

type OptionalifyTuple<Tuple extends any[]> = {
  [key in keyof Tuple]?: Tuple[key]
}


type ProperSubscribable<Values extends any[]> = {subscribeToThis: (subscription: Subscription<Values>, initialize?: boolean) => Token<any>, subscribeToChildren: (subscription: Subscription<Values>, initialize?: boolean) => Token<any>, unsubscribe: (subscription: Token<Subscription<Values>>) => void, get: () => Values, call: (subscription?: Subscription<Values>[] | Subscription<Values>, notifyChilds?: boolean) => void}
export type Subscribable<Values extends any[]> = ProperSubscribable<Values> | FuckedUpDataSet<Values> | DataBase<Values[0]>


export const dataSubscriptionCbBridge = Symbol("dataSubscriptionCbBridge")

export class _DataBaseSubscription<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>> {
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
    if (subscription[dataSubscriptionCbBridge] !== undefined) return subscription[dataSubscriptionCbBridge].data(subscription[dataSubscriptionCbBridge].data(), initialize, true)
    //@ts-ignore
    this._data = data
    //@ts-ignore
    this._subscription = subscription
    this._notifyAboutChangesOfChilds = notfiyAboutChangesOfChilds
    
    subscription[dataSubscriptionCbBridge] = this

    localSubscriptionNamespace.register(this as any)
    this.active(activate as any, initialize)
  }

  private isActive: boolean = false

  public active(): boolean
  public active(activate: false): this
  public active(activate: true, initialize?: boolean): this
  public active(activate?: boolean, initialize: boolean = true): this | boolean {
    if (activate === undefined) return this.isActive
    if (activate) this.activate(initialize)
    else this.deactivate()
    return this
  }

  private call(sure = true) {
    if (sure) (this._data as any).call(this._subscription, this._notifyAboutChangesOfChilds)
    return this
  }

  private destroy() {
    this.deactivate()

    for (let key in this) {
      delete this[key]
    }
  }

  public setToData(e: any) {
    this.deactivate();
    try {
      if (this._data instanceof Data) (this as any)._data.set(e)
      else (this as any)._data.apply(this._data, [e])
    }
    finally {
      this.activate(false)
    }
    
    return this
  }

  public setToDataBase(e: any) {
    return this.setToData(e)
  }

  
  public data(): ConcreteData
  public data(data: ConcreteData, initialize?: boolean): this
  public data(data?: ConcreteData, initialize: boolean = true): ConcreteData | this {
    if (data === undefined) return this._data
    else {
      if (this._data !== data) {
        let wasActive = this.active()
        this.deactivate()
        this._data = data
        if (wasActive) this.activate(initialize)
      }
      return this
    }
  }

  public dataBase(): ConcreteData
  public dataBase(data: ConcreteData, initialize?: boolean): this
  public dataBase(data?: ConcreteData, initialize?: boolean) {
    return this.data(data, initialize) as any
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
      const initiallyActive = this.active()
      this.deactivate()
      this._notifyAboutChangesOfChilds = notfiyAboutChangesOfChilds
      // TODO: check if there is a diff, when yes we must initialize
      if (initiallyActive) this.active(false)
    }

    return this
  }

  private subToken: Token<any>
  public activate(initialize: boolean = true): this {  
    if (this.isActive) return this;
    this.isActive = true
    const prevData = this._subscription[subscriptionDiffSymbol]
    const data = this._data as any
    const reallyInit = initialize && (!circularDeepEqual(prevData, data[instanceTypeSym] !== "DataBase" ? data.get() : (data as Function).apply(data)))
    this.subToken = this._notifyAboutChangesOfChilds ? (this._data as any).subscribeToChildren(this._subscription, reallyInit) : (this._data as any).subscribeToThis(this._subscription, reallyInit)
    return this
  }

  public deactivate(): this {
    if (!this.isActive) return this;
    this.isActive = false;
    const tok = this.subToken
    const {prev, next} = tok;
    (this as any)._data.unsubscribe(this.subToken) as Token<any>
    const initNotifyAboutChangesOfChilds = this._notifyAboutChangesOfChilds
    const data = this._data

    const sibib = (sib: Token<any>, prev: boolean) => {
      const sibRem = sib.remove.bind(sib)

      const adjecentSib = sib[prev ? "next" : "prev"]

      sib.remove = () => {
        delete sib.remove
        if (sib[prev ? "next" : "prev"] === adjecentSib && adjecentSib instanceof Token) sibib(adjecentSib, !prev)
        else delete this.activate

        return sibRem()
      }
      this.activate = (initialize = true) => {
        delete this.activate
        delete sib.remove
        if (initialize || initNotifyAboutChangesOfChilds !== this._notifyAboutChangesOfChilds || this._data !== data) return this.activate(initialize)
        if (this.isActive) return this;
        this.isActive = true
        sib[prev ? "insertTokenAfter" : "insertTokenBefore"](tok)
        // if (anyChange) if (initialize) (this._data as any).call(tok.value)
        return this
      }
    }
    if (prev instanceof Token) sibib(prev, true)
    else if (next instanceof Token) sibib(next, false)

    return this
  }

}

export type DataBaseSubscription<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>> = _DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>
export const DataBaseSubscription = _DataBaseSubscription as any as {
  new<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Subscribable<Values>, subscription: Subscription<Values>, activate?: false): 
    DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>

  new<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Subscribable<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean): 
    DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>

  new<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Data<Value>, subscription: Subscription<TupleValue>, activate?: false): 
    DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>

    
  new<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: Data<Value>, subscription: Subscription<TupleValue>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean): 
    DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>

  new<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: DataCollection<Values>, subscription: Subscription<Values>, activate?: false): 
    DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>
  new<Values extends Value[], TupleValue extends [Value] = [Values[number]], Value = TupleValue[0], ConcreteData extends Subscribable<Values> = Subscribable<Values>, ConcreteSubscription extends Subscription<Values> = Subscription<Values>>
    (data: DataCollection<Values>, subscription: Subscription<Values>, activate?: true, inititalize?: boolean, notfiyAboutChangesOfChilds?: boolean): 
    DataBaseSubscription<Values, TupleValue, Value, ConcreteData, ConcreteSubscription>
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
  setToData(val: Value): this 
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

export const subscriptionDiffSymbol = Symbol("diff")

export const instanceTypeSym = Symbol("instanceType")
Data.prototype[instanceTypeSym] = "Data"
