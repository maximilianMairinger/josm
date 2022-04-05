// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"


const ddb = {}
const entry = {lel: 0, what: 2}
// @ts-ignore
ddb.flat = entry
// @ts-ignore
ddb.tree = entry

const db = new DataBase(ddb) as DataBase<{flat: typeof entry, tree: typeof entry}>

db.tree((e,s) => {
  console.log(copy(s))
})

debugger
db.flat({lel: 22})
db.tree({lel: 33})
