// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"


const ddb = {}
const entry = {lel: 0, what: 2}


// @ts-ignore
ddb.tree = {deep: {deeper: {deepest: entry}}}


const db = new DataBase(ddb) as DataBase<{flat: typeof entry, tree: {deep: {deeper: {deepest: typeof entry}}}}>

db({flat: entry})

db((e,s) => {
  console.log(copy(s))
})

debugger
db.tree.deep.deeper.deepest({lel: 232})

