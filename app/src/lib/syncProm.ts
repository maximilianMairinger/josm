export class SyncProm<Val = unknown, Err = unknown> {
  constructor(f: (res: (val: Val) => void, rej: (err: Err) => void) => void) {
    f((val) => {
      this.settled = true
      this.resolved = true
      this.val = val
      for (const f of this.resLs) f(val)
      this.resLs.length = 0
    }, (val) => {
      this.settled = true
      this.resolved = false
      this.val = val
      for (const f of this.rejLs) f(val)
      this.rejLs.length = 0
    })
  }
  settled = false
  resolved: boolean
  val: Val | Err
  resLs = []
  rejLs = []
  then<T>(f: (val: Val) => T): SyncProm<T> {
    if (this.settled) {
      if (this.resolved) return SyncProm.resolve(f(this.val as any))
    }
    else return new SyncProm((res, rej) => {
      this.resLs.push((val) => {
        res(f(val))
      })
    })
  }
  catch<Err>(f: (val: Val) => Err): SyncProm<unknown, Err> {
    if (this.settled) {
      if (!this.resolved) return SyncProm.reject(f(this.val as any))
    }
    else return new SyncProm((res, rej) => {
      this.rejLs.push((val) => {
        rej(f(val))
      })
    })
  }
  static resolve<T>(val: T): SyncProm<T> {
    return new SyncProm((r) => {r(val)})
  }
  static reject<Err>(val: Err): SyncProm<unknown, Err> {
    return new SyncProm((q, r) => {r(val)})
  }
}

export default SyncProm