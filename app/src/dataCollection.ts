import { Subscription, FuckedUpDataSetify, DataSubscription, dataSubscriptionCbBridge, attachSubscribeableMixin } from "./data"

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
      if (subscription instanceof DataSubscription) return subscription.data(this, initialize)
      else if (this.isSubscribed(subscription)) return subscription[dataSubscriptionCbBridge].activate()
      else return new DataSubscription(this, subscription, true, initialize)
    }
  }

  //@ts-ignore
  protected isSubscribed(subscription: Subscription<Values>): boolean {}
  protected subscribeToThis(subscription: Subscription<Values>, initialize: boolean) {}
  protected subscribeToChildren(subscription: Subscription<Values>, initialize: boolean) {}
  protected unsubscribeToThis(subscription: Subscription<Values>, initialize: boolean) {}
  protected unsubscribeToChildren(subscription: Subscription<Values>, initialize: boolean) {}

  public got(subscription: Subscription<Values> | DataSubscription<Values>): DataSubscription<Values> {
    return (subscription instanceof DataSubscription) ? subscription.deactivate()
    : new DataSubscription(this, subscription, false)
  }

} 

attachSubscribeableMixin(DataCollection)
