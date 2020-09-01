import { Data, DataBase, setDataDerivativeIndex, setDataBaseDerivativeIndex, DataCollection, DataSubscription, Return } from "../../app/src/josm"
import constructIndex from "key-index"
import constructAttatchToPrototype from "attatch-to-prototype"
import clone from "fast-copy"
import { constructObjectIndex } from "key-index"



let historyIndex = constructIndex((a: any) => {return {} as {[timestamp: number]: {[index: number]: string}}})


let DATA = setDataDerivativeIndex(
  class Num extends Data<number> {

    inc(by: number = 1) {
      this.set(this.get() + by)
      return new Return(undefined, [by])
    }
    dec(by: number = 1) {
      this.set(this.get() - by)
      return new Return(undefined, [by])
    }
  },
  class Str extends Data<string> {
    
    inject(injection: string, atIndex: number = this.get().length) {
      if (injection.length === 0) return new Return(undefined, null)
      this.set(this.get().splice(atIndex as any, 0, injection))
      let offset = {}
      offset[atIndex] = injection.length
      return new Return(undefined, [injection, atIndex], offset)
    }
    del(length: number, atIndex: number) {
      if (length < 1) return new Return(undefined, null)
      let offset = {}
      offset[atIndex] = -length
      let ret = new Return(undefined, [length, atIndex, this.get().substr(atIndex, length)], offset)
      this.set(this.get().splice(atIndex, length))
      return ret
    }
  }
).proxy(
  class UndoNum extends Data<number> {

    inc(by) {
      //@ts-ignore
      this.dec(by)
    }
    dec(by) {
      //@ts-ignore
      this.inc(by)
    }
  },
  class UndoStr extends Data<string> {

    inject(injection: string, atIndex: number) {
      this.set(this.get().splice(atIndex, injection.length))
    }
    del(length: number, atIndex: number, deleted: string) {
      this.set(this.get().splice(atIndex, 0, deleted))
    }
  }
).contextualIndexing((() => {

  function stringIndex(len: Length, ind: Index, offsetNote: {[key in Index]: Length}) {
    let del = []
    let add = []
    for (let index in offsetNote) {
      let i = +index
      if (ind >= i) ind += offsetNote[index]
      else {
        del.add(i)
        i += len
        add.add({i, n: offsetNote[index]})
      }
    }

    del.ea((e) => {
      delete offsetNote[e]
    })
    add.ea((e) => {
      offsetNote[e.i] = e.n
    })
    
    return ind
  }



  return {
    inject([injection, atIndex, ...rest]: [string, number], offsetNote: {[key in Index]: Length}) {
      return [injection, stringIndex(injection.length, atIndex, offsetNote), ...rest]
    },
  
    del([length, atIndex, ...rest]: [number, number], offsetNote: {[key in Index]: Length}) {
      return [length, stringIndex(length, atIndex, offsetNote), ...rest]
    }
  }
})())



let q = new DataBase({q: "qwe", qq: {q: 2}})
q.qq.q.get()



type Index = number
type Length = number



let w = 5000 - 5

Date.now = () => {
  w += 5
  return w
}
 


const { HistoryIndex } = DATA


let s = new DATA("Hello")
let h = new HistoryIndex(s)

//@ts-ignore
let ind = window.ind = function() {
  console.log((h as any).historyIndex())
}

//@ts-ignore
window.s = s
//@ts-ignore
window.h = h

// debugger
// let index = constructObjectIndex((time) => constructObjectIndex((id) => []))
// index(5000)(3).add(22)
// index()[5000][3].set([1,2,3])
// console.log(index())



let txt = document.getElementById("txt") as HTMLTextAreaElement

let modes = ["insertFromPaste", "insertText", "deleteContentBackward", "deleteContentForward", "deleteByCut", "deleteByDrag", "insertFromDrop", "deleteWordBackward", "deleteWordForward "]

function inject(injection: string, at: number) {
  if (injection.length === 0) return
  console.log("inj", injection, at)
}

function del(del: number, at: number) {
  if (del === 0) return
  console.log("del", del, at)
}

function set(set: string) {
  console.log("set", set)
}

let prevText: string
let selection: {start?: number, end?: number} = {}
let exception = false
let dele = false
let type: string
txt.addEventListener("beforeinput", (e: InputEvent) => {
  selection.start = txt.selectionStart
  selection.end = txt.selectionEnd
  type = e.inputType
  prevText = txt.value

  try {
    if (type.startsWith("insert")) {
      if (e.data !== null) {
        del(selection.end - selection.start, selection.start)
        inject(e.data, selection.start)
      }
      else throw new Error()
    }
    else if (type.startsWith("delete")) {
      let diff = selection.end - selection.start
      if (diff > 0) del(diff, selection.start)
      else {
        dele = true
      }
    }

  }
  catch(ex) {
    console.warn("Unable to inject modification with inputType: \"" + e.inputType + "\"\n", "Event: ", e)
    exception = true
  }

  
  
  // console.log(e)
})
let text: string
txt.addEventListener("input", (e) => {
  text = txt.value
  try {
    if (dele) {
      dele = false
      let diff = prevText.length - text.length
      if (type.endsWith("Backward")) del(diff, selection.start - diff)
      else if (type.endsWith("Forward")) del(diff, selection.start)
      else throw new Error()
    }
  }
  catch(e) {
    exception = true
  }
  
  if (exception) {
    exception = false
    set(text)
  }
})
txt.focus()




// s.get(console.log)
// // debugger
// s.inject("world")
// ind()
// // debugger
// h.apply({timeStamp: 5003, id: "inject", args: [ " " ]})
// ind()
// // debugger
// h.apply({timeStamp: 5009, id: "inject", args: [ "! Over tere." ]})
// ind()
// // debugger
// h.apply({timeStamp: 5050, id: "inject", args: [ " My name is Tom." ]})
// ind()
// // debugger
// h.apply({timeStamp: 5040, id: "inject", args: [ "h", 19 ]})
// ind()

// // debugger
// h.apply({timeStamp: 5044, id: "del", args: [ 1, 23 ]})
// ind()
// // debugger
// h.apply({timeStamp: 5045, id: "inject", args: [ "!!!!", 23 ]})
// ind()
// // debugger
// h.apply({timeStamp: 5020, id: "del", args: [ 1, 8 ]})
// // ind()
// // todo multiculti


console.log("go")










// let w = new DataBase({w: "qwe"})

// console.log(w)

// let lang = new DataBase({
//   ok: "Alright",
//   what: "Excuse me?!"
// })


// let db = new DataBase({student: {fullName: "Max", age: 17}, teacher: {fullName: "Brein", age: 30}})



// let stud = db(new Data("student"))

// let f;

// lang.ok.get((ok) => {

//   stud(new Data("fullName")).get((e) => {
//     console.log(ok, e)
//   })

// })

// setTimeout(() => {
//   lang.ok.set("Ok")

//   setTimeout(() => {
//     db.student.fullName.set("Maarks")
//   }, 500)
// }, 500)






// TODO: Custom objects. How to create new elements? by default added to base class array (josm serialize style) when creating new.
// Types for db function set object


// TODO: make Datas at the end of DataBase primitives with functions attatched. Or give em valueof and toSTring. Maybe this is the same? (Probably better). Also consider having Data extend Function to enable similar syntax like db with all those overloads.
// Also consider performance of only importing Primitive data shit. Leavin Data as it is could be & supporting this syntax could be done by writing data once and then extending it somehow; or implementing its shit in different contextes -> one with and one without Function as super




















