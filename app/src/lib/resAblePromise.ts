import _SyncProm from "sync-p"; const SyncProm = _SyncProm as typeof Promise


const constrRes = (SuperClass: typeof Promise) => class ResablePromise<T = any> extends SuperClass<T> {
  public readonly setteled: boolean
  public readonly res: (t: T) => void
  public readonly rej: (err: any) => void
  public readonly onSettled: Promise<void>
  constructor(f?: (res: (t: T) => void, rej: (err: any) => void) => void) {
    let rres: any
    let rrej: any
    super((res, rej) => {
      //@ts-ignore
      rres = (r) => {
        //@ts-ignore
        this.setteled = true
        resOnSettled()
        res(r)
      }
      //@ts-ignore
      rrej = (r) => {
        //@ts-ignore
        this.setteled = true
        resOnSettled()
        rej(r)
      }
    })

    this.res = rres
    this.rej = rrej

    this.setteled = false

    let resOnSettled: Function
    this.onSettled = new SuperClass((res) => {
      resOnSettled = res
    }) as any

    if (f) f(rres, rrej)
  }
}

export type ResablePromise<T> = Promise<T> & {res(t: T): void, rej(t: any): void, setteled(): Promise<T> }
export const ResablePromise = constrRes(Promise)

export type ResableSyncPromise<T> = Promise<T> & {res(t: T): void, rej(t: any): void, setteled(): Promise<T> }
export const ResableSyncPromise = constrRes(SyncProm)

export default ResablePromise


export function wrapPromiseLike(p: Promise<any>) {
  return new Promise((res, rej) => {
    p.then(res).catch(rej)
  })
}

