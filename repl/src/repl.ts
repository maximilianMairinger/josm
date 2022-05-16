import { DataSubscription } from "./../../app/src/data"
// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"
import { InternalDataBase, internalDataBaseBridge, parsingId } from "../../app/src/dataBase"

// TODO: what about parsing queties not created with stringify? can cause infinite recursion?
import { stringify, parse, retrocycle } from "./serialize"
import LinkedList, { Token } from "fast-linked-list"
import { MultiMap } from "./../../app/src/lib/multiMap"
import { deepEqual } from "fast-equals"

let calls = 0
const expect = (e) => {
  return {
    toBe(f) {
      calls++
      if (!deepEqual(e, f)) throw new Error()
    },
    toEqual(f) {
      calls++
      if (!deepEqual(e, f)) throw new Error()
    }
  }
} 
expect.assertions = (e) => {
  setTimeout(() => {
    if (e !== calls) throw new Error()
  })
}


let d1 = new Data(1)
    let d2 = new Data(2)

    let d = new DataCollection(d1, d2)

    let i = 0
    expect.assertions(2)
    let f = (...a) => {
      i++
      if (i === 1) {
        expect(a).toEqual([1, 2])
      }
      else if (i === 2) {
        expect(a).toEqual([100, 2])
      }
      else if (i === 3) {
        fail()
      }
    }

    d.get(f)


    d1.set(100)
    d.got(f)
    d1.set(2000)
    d2.set(2000)







const toPointer = (parts) => '#' + ["", ...parts].map(part => String(part).replace(/~/g, '~0').replace(/\//g, '~1')).join('/')
const resolvePointer = (pointer) => {
  let p = pointer.slice(1)
  const ar = []
  if (p === "") return ar
  p = p.slice(1)
  for (const part of p.split('/').map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    ar.push(part)
  }
  return ar
}


const max = {
  myName: "Max",
  age: 27,

}

const ting = {
  myName: "Ting",
  age: 23,
  
}



// @ts-ignore
max.loves = ting
// @ts-ignore
ting.loves = max


const ob = {
  ppl: max
}





function findRoot(db: InternalDataBase<{}>, findSub: any) {
  const initChildMap = getParents(db)
  for (const sub of (db as any).subscriptionsOfChildChanges) {
    if (sub === findSub) return toPointer([])
  }

  // we dont want to look into the last path, as it is the one that was just added.
  const keys = [...initChildMap.keys()]
  let lastVals: any
  let lastKey: any
  if (keys.length > 1) {
    lastKey = keys[keys.length - 1]
    lastVals = initChildMap.get(lastKey)
    initChildMap.delete(lastKey)
  } 
  


  try {
    const initEntries = [...initChildMap.entries()]

    let currentLevel = initEntries.map(e => e[0])
    let currentPath = initEntries.map(e => [e[1][0].key]) as any[]


  
  
  
    let nextLevel: typeof currentLevel
    let nextPath: typeof currentPath
  
    while(true) {
      nextPath = []
      nextLevel = []
  
      let i = 0
      for (const db of currentLevel) {
        for (const sub of (db as any).subscriptionsOfChildChanges) {
          if (sub === findSub) return toPointer(currentPath[i])
        }
  
  
        const myNextLevelMap = getParents(db)
        const fullPath = currentPath[i]
        for (const [dbDeep, deepPaths] of myNextLevelMap) {
          nextPath.push([deepPaths[0].key, ...fullPath])
          nextLevel.push(dbDeep)
        }
  
        i++
      }
      
      currentLevel = nextLevel
      currentPath = nextPath
    }
  }
  finally {
    if (keys.length > 1) {
      for (const lastVal of lastVals) {
        initChildMap.set(lastKey, lastVal)
      }
    }
  }
}

function getParents(db: InternalDataBase<{}>) {
  return (db as any).beforeDestroyCbs as MultiMap<InternalDataBase<{}>, {key: string}>
}


const resolveOldRecursion = (() => {
  let known: Map<any, any>
  return function resolveOldRecursion(diff: object, rootSub: any) {
    known = new Map()
    return resolveOldRecursionRec(diff, rootSub)
  }

  function resolveOldRecursionRec(diff: object, rootSub: any) {
    if (known.has(diff)) return known.get(diff)
    const res = {}
    known.set(diff, res)
    for (let dk in diff) {
      let val = diff[dk]
      if (diff[dk] instanceof Object) {
        if (val[parsingId] !== undefined) {
          const db = val[parsingId][internalDataBaseBridge] as InternalDataBase<{}>
          const parents = getParents(db)
          if (parents.size >= 2  || ((db as any).isRoot && parents.size === 1)) {
            res[dk] = { $ref: findRoot(db, rootSub) }
          }
          else res[dk] = val
        }
        else {
          res[dk] = resolveOldRecursionRec(val, rootSub)
        }
      }
      else {
        if (dk === "$ref" && typeof val === "string" && val.startsWith("#")) val = "#" + val
        res[dk] = val
      }
    }
    return res
  }
})()


function mergeOldRecursionToDB(rootStore: object) {
  let known: Set<any>
  function rec(diff: object) {
    if (diff instanceof Object) {
      if (known.has(diff)) return
      known.add(diff)

      for (const key in diff) {
        const val = diff[key]
        if (key === "$ref" && typeof val === "string") {
          if (val.startsWith("##")) diff[key] = val.slice(1)
          else if (val.startsWith("#")) {
            const path = resolvePointer(val)
            
            let c = rootStore
            for (const entry of path) {
              c = c[entry]
            }
            return c
          }
        }
        else {
          const ret = rec(diff[key])
          if (ret !== undefined) diff[key] = ret
        }
      }
    }
  }
  return function mergeOldRecursion(diff: object) {
    known = new Set()
    rec(diff)
  }
}




const db2 = new DataBase({})
db2((full, diff) => {
  console.log("resived", full, diff)
}, true, false)
const mergeOldRecursion = mergeOldRecursionToDB(db2())


const db = new DataBase(ob)
db(function sub (full, diff) {
  console.log(resolveOldRecursion(diff, sub))

  const overNetwork = stringify(resolveOldRecursion(diff, sub))

  // network
  const parsed = parse(overNetwork)
  mergeOldRecursion(parsed)
  console.log("parsed2", parsed)

  db2(parsed)
})


db({
  leeel: ob
})


// db({
//   wellNew: {wellNew2: ting, wellNew3: max} 
// })



db2({whooo: "yea"})

// db({
//   wellNew: undefined
// })


// db({ppl: {loves: {myName: "Tingo"}}})
























// const currentLanguage = new Data("en") as Data<"en" | "de">

// const dat = {en: {hi: "hello"}, de: {hi: "qqq"}}

// const def = deepDefault(dat.en)

// const superLang = new DataBase<{en: any, de?: any}>(dat, {en: def, de: def})

// debugger
// const lang = superLang(currentLanguage) as any as DataBase<any>

// lang.hi.get((e) => {
//   console.log(e)
// })

// currentLanguage.set("de")

// // superLang({de: {hi: "hello"}})
// // console.log(lang())




// function deepDefaultRec(ob: any, lastKey: string): any {
//   const endOb = {}
//   for (const k in ob) {
//     if (typeof ob[k] === "object") endOb[k] = deepDefaultRec(ob[k], k)
//     else endOb[k] = lastKey + " " + k
//   }
//   return endOb
// }
// function deepDefault(ob: any) {
//   const endOb = {}
//   for (const k in ob) {
//     if (typeof ob[k] === "object") endOb[k] = deepDefaultRec(ob[k], k)
//     else endOb[k] = k
//   }
//   return endOb
// }