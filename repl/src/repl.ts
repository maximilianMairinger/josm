// import { Data, DataBase } from "./../../app/src/extendedDB"
import { Data, DataCollection } from "./../../app/src/josm"



const dc = new DataCollection(new Data("lel1"))
dc.get((...u) => {
  console.log("update", u)
})


const d11 = new Data("lel1")
const d22 = new Data("lel22")
dc.set(d11, d22)

// d3.set("aye")