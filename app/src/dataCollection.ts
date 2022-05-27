import { constructAttatchToPrototype } from "attatch-to-prototype"
import LinkedList, { Token } from "fast-linked-list"
import diff from "fast-object-diff"
import { Subscription, FuckedUpDataSetify, DataSubscription, dataSubscriptionCbBridge, attachSubscribableMixin, instanceTypeSym, call, unsubscribe, subscribe, Data } from "./data"

export class DataCollection<Values extends any[] = unknown[], Value extends Values[number] = Values[number]> {
  private subscriptions: LinkedList<Subscription<Values>> = new LinkedList()
  private subscriptionsLength = new Data(0)
  private subscriptionsEmpty = this.subscriptionsLength.tunnel(length => length === 0)

  //@ts-ignore
  private datas: FuckedUpDataSetify<Values> = []
  private store: Values = [] as any

  private locSubNsReg: {destroy: () => void}[] = []

  private observers: DataSubscription<[Value]>[] = []

  constructor(...datas: FuckedUpDataSetify<Values>) {
    //@ts-ignore
    this.set(...datas)

    this.subscriptionsEmpty.get((empty) => {
      if (empty) {
        for (const observer of this.observers) observer.deactivate()
      }
      else {
        this.datas.forEach((data, i) => {
          this.store[i] = data.get()
          this.observers[i].activate(false)
        })
      }
    }, false)
  }

  protected __call(subs: Subscription<Values>[] = this.subscriptions as any) {
    const get = this.get()
    for (const sub of subs) sub(...get)
  }

  protected destroy() {
    for (const e of this.locSubNsReg) e.destroy()
    this.locSubNsReg.clear()
    for (const key in this) {
      delete this[key]
    }
  }


  public set(...datas: any[]) {
    const empty = this.subscriptionsEmpty.get()
    if (empty) {
      this.datas.ea((data, i) => {
        data.got(this.observers[i])
      })
    }
    this.observers.clear();

    (this as any).datas = datas

    const oldStore = this.store
    //@ts-ignore
    this.store = this.datas.map((data) => data.get())

    if (empty) {
      const anyChange = diff.flat(oldStore, this.store)
      if (anyChange) this.__call()
    }
    


    this.datas.ea((data, i) => {
      this.observers[i] = data.get(() => {
        this.store[i] = data.get()
        this.__call()
      }, false)
    })

    if (empty) for (const observer of this.observers) observer.deactivate()
  }

  public get(): Values
  public get(subscription: Subscription<Values> | DataSubscription<Values>, initialize?: boolean): DataSubscription<Values>
  public get(subscription?: Subscription<Values> | DataSubscription<Values>, initialize: boolean = true): DataSubscription<Values> | Values {
    //@ts-ignore
    if (subscription === undefined) return this.store
    else {
      if (subscription instanceof DataSubscription) return subscription.data(this, false).activate(initialize)
      else if (subscription[dataSubscriptionCbBridge]) return subscription[dataSubscriptionCbBridge].data(this, false).activate(initialize)
      else return new DataSubscription(this, subscription, true, initialize)
    }
  }

  //@ts-ignore
  protected subscribeToThis(subscription: Subscription<Values>, initialize: boolean) {}
  protected subscribeToChildren(subscription: Subscription<Values>, initialize: boolean) {}
  protected unsubscribe?(tok: Token<Subscription<[Value]>>): void
  
  public got(subscription: Subscription<Values> | DataSubscription<Values>): DataSubscription<Values> {
    return (subscription instanceof DataSubscription) ? subscription.deactivate()
    : subscription[dataSubscriptionCbBridge].deactivate()
  }

} 

const attach = constructAttatchToPrototype(DataCollection.prototype)


attach("call", call)
attach("unsubscribe", function(subscriptionToken: Token<any>) {
  const suc = unsubscribe.call(this, subscriptionToken)
  if (suc) this.subscriptionsLength.set(this.subscriptionsLength.get() - 1)
  return suc
})
attach(["subscribeToThis", "subscribeToChildren", "subscribe"], function(subscription: any, initialize: any) {
  const ret = subscribe.call(this, subscription, initialize)
  this.subscriptionsLength.set(this.subscriptionsLength.get() + 1)
  return ret
})

DataCollection.prototype[instanceTypeSym] = "DataCollection"
