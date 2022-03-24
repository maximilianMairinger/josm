// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataCollection } from "./../../app/src/josm"



const dc = new DataCollection(new Data("lel1"), new Data("lel2"))
dc.get((...u) => {
  console.log("update", u)
})


const d3 = new Data("lel3")
dc.set(d3, new Data("lel4"))

d3.set("aye")