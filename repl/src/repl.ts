// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"


const ddb = {}
const entry = {lel: 0, what: 2}


// @ts-ignore
ddb.tree = {darp: {deeper: {deep: entry}}, loc: {deepLocal: entry}}


const db = new DataBase(ddb) as DataBase<{flat: typeof entry, tree: {darp: {deeper: {deep: typeof entry}}, loc: {deepLocal: typeof entry}}}>

db({flat: entry})

db.tree((e,s, q) => {
  debugger

  
  console.log(e, s, q)
}, false)


debugger
db.tree({qqq: 2})
db.tree({qqq: undefined})


