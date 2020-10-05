import { Data, DataBase, setDataDerivativeIndex, setDataBaseDerivativeIndex, DataCollection, DataSubscription, Return } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"
import { constructObjectIndex } from "key-index"


let d = new DataBase({key1: "val1", key2: {key3: "key3", key4: "key4"}}, {key1: "def1", key5: "def5", key2: {key3: "def3"}})
d(console.log)
d.key1.set("val11")
debugger
//@ts-ignore
d.key2({}, true)