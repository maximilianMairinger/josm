import { DataSubscription } from "./../../app/src/data"
// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataBase, DataCollection } from "./../../app/src/josm"
import copy from "fast-copy"


const currentLanguage = new Data("en") as Data<"en" | "de">

const lang = new DataBase<{en: any, de?: any}>({en: {hi: "hello"}, de: {hi: "hallo"}})(currentLanguage) as any as DataBase<any>

debugger
currentLanguage.set("de")

console.log(lang())
