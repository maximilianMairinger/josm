import { Data, DataBase } from "./replLib"


let eee: DataBase<{eee: string}>

const dbEEE = new DataBase({ee: "ee"})



const db = new DataBase({
  helloKey: 2,
  arrayKey: [1, 2, 3],
})

// @ts-ignore
window.db = db

const func = db((full) => {
  console.log(full)
})


db.helloKey.inc(6)
db.arrayKey.add(4)



func.deactivate()

db.helloKey.inc(6)
console.log("done")
func.activate(false)
console.log("done 4 real")
