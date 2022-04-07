// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"


const ddb = {}
const entry = {lel: 0, what: 2}


// @ts-ignore
ddb.tree = {deep: entry, deeper: {deep: entry}}


const db = new DataBase(ddb) as DataBase<{flat: typeof entry, tree: {deep: typeof entry, deeper: {deep: typeof entry}}}>

db({flat: entry})

db((e,s) => {
  console.log(s)
})


debugger
db.tree.deeper.deep.lel.set(22)


