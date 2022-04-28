import { DataSubscription } from "./../../app/src/data"
// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"






const currentLanguage = new Data("en") as Data<"en" | "de">

const dat = {en: {hi: "hello"}, de: {hi: "qqq"}}

const def = deepDefault(dat.en)

const superLang = new DataBase<{en: any, de?: any}>(dat, {en: def, de: def})

debugger
const lang = superLang(currentLanguage) as any as DataBase<any>

lang.hi.get((e) => {
  console.log(e)
})

currentLanguage.set("de")

// superLang({de: {hi: "hello"}})
// console.log(lang())




function deepDefaultRec(ob: any, lastKey: string): any {
  const endOb = {}
  for (const k in ob) {
    if (typeof ob[k] === "object") endOb[k] = deepDefaultRec(ob[k], k)
    else endOb[k] = lastKey + " " + k
  }
  return endOb
}
function deepDefault(ob: any) {
  const endOb = {}
  for (const k in ob) {
    if (typeof ob[k] === "object") endOb[k] = deepDefaultRec(ob[k], k)
    else endOb[k] = k
  }
  return endOb
}