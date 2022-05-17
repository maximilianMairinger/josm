export const cloneKeysButKeepSym = (() => {
  let known: WeakMap<any, any>
  return function cloneKeysButKeepSym(ob: any) {
    known = new WeakMap()
    return cloneKeysButKeepSymRec(ob)
  }
  function cloneKeysButKeepSymRec(ob: any) {
    if (ob instanceof Object) {
      if (known.has(ob)) return known.get(ob)
      const cloned = new ob.constructor()
      known.set(ob, cloned)
      for (const key of Object.keys(ob)) cloned[key] = cloneKeysButKeepSymRec(ob[key])
      for (const sym of Object.getOwnPropertySymbols(ob)) cloned[sym] = ob[sym]
      return cloned
    }
    else return ob
  }
})()



export const cloneKeys = (() => {
  let known: WeakMap<any, any>
  return function cloneKeys(ob: any) {
    known = new WeakMap()
    return cloneKeysRec(ob)
  }
  function cloneKeysRec(ob: any) {
    if (ob instanceof Object) {
      if (known.has(ob)) return known.get(ob)
      const cloned = new ob.constructor()
      known.set(ob, cloned)
      for (const key of Object.keys(ob)) cloned[key] = cloneKeysRec(ob[key])
      return cloned
    }
    else return ob
  }
})()
