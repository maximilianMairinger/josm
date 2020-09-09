import { Data, DataBase, setDataDerivativeIndex, setDataBaseDerivativeIndex, DataCollection, DataSubscription, Return } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"
import { constructObjectIndex } from "key-index"



let lang = new DataBase({de: {greet: {morning: "morgen"}}, en: {greet: {morning: "morning"}}})
let currentLang = new Data("de")
let ll = lang(currentLang) as DataBase<{greet: {morning: string}}>
ll.greet.morning.get(console.log)
currentLang.set("en")
