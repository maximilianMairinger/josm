import { DataSubscription } from "./../../app/src/data"
// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"
import { InternalDataBase, internalDataBaseBridge, parsingId } from "../../app/src/dataBase"

// TODO: what about parsing queties not created with stringify? can cause infinite recursion?
import { stringify, parse, retrocycle, toPointer } from "./serialize"



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







function findRoot(initChildMap: Map<InternalDataBase<{}>, {key: string}>, findSub: any) {
  

  let currentLevel = [...initChildMap.keys()]
  let currentPath = [...initChildMap.values()].map(({key}) => [key])


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
      for (const [dbDeep, deepPath] of myNextLevelMap) {
        nextPath.push([deepPath.key, ...fullPath])
        nextLevel.push(dbDeep)
      }

      i++
    }
    
    currentLevel = nextLevel
    currentPath = nextPath
  }
}

function getParents(db: InternalDataBase<{}>) {
  return (db as any).beforeDestroyCbs as Map<InternalDataBase<{}>, {key: string}>
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
          if (parents.size >= 2) {
            res[dk] = { $ref: findRoot(parents, rootSub) }
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
            const path = val.slice(1).split('/').map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))
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
})
const mergeOldRecursion = mergeOldRecursionToDB(db2())


const db = new DataBase({})
db(ob)
db(function sub (full, diff) {
  const overNetwork = stringify(resolveOldRecursion(diff, sub))

  // network
  const parsed = parse(overNetwork)
  mergeOldRecursion(parsed)
  console.log("parsed2", parsed)

  db2(parsed)
})




db({
  wellNew: {wellNew2: ting, wellNew3: max} 
})



db2({ppl: {myName: "Maxooorg"}})

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