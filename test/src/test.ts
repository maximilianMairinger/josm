import { Data, DataSubscription, DataCollection, DataBase } from "../../app/src/josm"
import delay from "delay"
import clone from "./../../app/src/lib/clone"
import "./extend"



describe("Data", () => {
  test('Current Value', () => {
    let d = new Data(2)
  
    expect(d.get()).toBe(2)
  
    d.set(4)
    
    expect(d.get()).toBe(4)
  })
  
  
  test('Subscription init', () => {
    let d = new Data(2)
  
    d.get((e) => {
      expect(e).toBe(2)
    })
  })
  
  
  test('Subscription noinit', () => {
    let d = new Data(2)
  
    d.get((e) => {
      fail()
    }, false)
  })
  
  
  test('Unsubscribe Vanilla', () => {
    let d = new Data(2)
  
    let i = 0
    expect.assertions(3)
    let f = (e) => {
      i++
      if (i === 1) expect(e).toBe(4)
      else if (i === 2) expect(e).toBe(2)
      else if (i === 3) expect(e).toBe(4)
      else if (i === 4) fail()
    }
  
    d.get(f, false)
    d.set(4)
    d.got(f)
    d.set(123)
    d.set(321)
    d.set(321)
    d.get(f, false)
    d.set(2)
    d.set(2)
    d.got(f)
    d.set(4)
    d.get(f)
    d.set(4)
    d.got(f)
    d.set(312)
  })

  test('Unsubscribe DataSubscription', () => {
    let d = new Data(2)
  
    let i = 0
    expect.assertions(3)
    let f = d.get((e) => {
      i++
      if (i === 1) expect(e).toBe(4)
      else if (i === 2) expect(e).toBe(2)
      else if (i === 3) expect(e).toBe(4)
      else if (i === 4) fail()
    }, false)


    d.set(4)
    d.got(f)
    d.set(123)
    d.set(321)
    d.set(321)
    d.get(f, false)
    d.set(2)
    d.set(2)
    d.got(f)
    d.set(4)
    d.get(f)
    d.set(4)
    d.got(f)
    d.set(312)
  })

  
  
  test('Subscription value change', () => {
    let d = new Data(2)
  

    expect.assertions(3)
    let i = 0
    d.get((e) => {
      i++
      if (i === 1) {
        expect(e).toBe(2)
      }
      else if (i === 2) {
        expect(e).toBe(3)
      }
      else if (i === 3) {
        expect(e).toBe(4)
      }
    })
  
    d.set(3)
    d.set(4)
  })
  
  
  test('Dont notify when set value doesnt change', () => {
    let d = new Data(2)
  
    d.get((e) => {
      fail()
    }, false)
  
    d.set(2)
  })
})



describe("DataSubscription", () => {
  test('Data support', () => {
    new DataSubscription(new Data(2), (e) => {
      expect(e).toBe(2)
    })
  })

  test('DataCollection support', () => {
    new DataSubscription(new DataCollection(new Data(1), new Data("2")), (...a) => {
      expect(a).toEqual([1, "2"])
    })
  })


  test('Inital activation', () => {
    (() => {
      let data1 = new Data(2)
      let subscription1 = (e) => {
        expect(e).toBe(2)
      } 
      let d = new DataSubscription(data1, subscription1, true)
    })();
  
    (() => {
      let data1 = new Data(4)
      let subscription1 = (e) => {
        expect(e).toBe(4)
      } 
      let d = new DataSubscription(data1, subscription1)
    })();
  
    (() => {
      let data1 = new Data(4)
      let subscription1 = (e) => {
        fail()
      } 
      let d = new DataSubscription(data1, subscription1, false)
  
  
      data1.set(3)
      data1.set(1)
    })();
  })
  
  
  test("Initialize", () => {
    (() => {
      let i = 0
  
      let data1 = new Data(4)
      let subscription1 = (e) => {
        i++
        if (i === 1) {
          expect(e).toBe(4)
        }
        else if (i === 2) {
          expect(e).toBe(3)
        }
        
      } 
      let d = new DataSubscription(data1, subscription1)
  
  
      data1.set(3)
    })();


    (() => {
      let i = 0

      let data1 = new Data(4)
      let subscription1 = (e) => {
        i++
        if (i === 1) {
          expect(e).toBe(4)
        }
        else if (i === 2) {
          expect(e).toBe(3)
        }
        
      } 
      let d = new DataSubscription(data1, subscription1, true, true)


      data1.set(3)
    })();


    (() => {
      let data1 = new Data(4)
      let subscription1 = (e) => {
        fail()
        
      } 
      let d = new DataSubscription(data1, subscription1, true, false)

      data1.set(4)
    })();
  })

  test("Get active state", () => {
    let d = new Data(4)
    let subscription1 = (e) => {
      
    } 
    let s = new DataSubscription(d, subscription1, true, false)

    expect(s.active()).toBe(true)
    s.active(!s.active())
    expect(s.active()).toBe(false)
    s.activate()
    expect(s.active()).toBe(true)
    s.deactivate()
    s.deactivate()
    expect(s.active()).toBe(false)
    s.activate()
    s.active(true)
    expect(s.active()).toBe(true)
    s.activate()
    s.active(true)
    s.deactivate()
    expect(s.active()).toBe(false)
  })


  test("Active state change", () => {
    let d = new Data(4)

    expect.assertions(4)
    let i = 0
    let subscription1 = (e) => {
      i++
      if (i === 1) expect(e).toBe(4)
      else if (i === 2) expect(e).toBe(5)
      else if (i === 3) expect(e).toBe(6)
      else if (i === 4) expect(e).toBe(2)
      else if (i === 5) fail()
    } 
    let s = new DataSubscription(d, subscription1)

    s.active(false)
    d.set(123)
    s.active(false)
    d.set(4)
    s.active(true)
    s.activate()
    s.activate()
    d.set(5)
    s.deactivate()
    s.deactivate()
    s.active(false)
    d.set(6)
    s.active(!s.active())
    s.deactivate()
    d.set(0)
    d.set(2)
    s.activate()
    d.set(2)
  })

  test("Subscription and Data getter", () => {
    let d = new Data(4)
    let subscription1 = (e) => {
      expect(e).toBe(4)
    } 
    let s = new DataSubscription(d, subscription1)

    expect(s.subscription()).toBe(subscription1)
    expect(s.data()).toBe(d)
  })



  test("Subscription change", () => {
    let d = new Data(4)

    expect.assertions(3)
    let subscription1 = (e) => {
      expect(e).toBe(4)
    } 
    let i = 0
    let subscription2 = (e) => {
      i++
      if (i === 1) expect(e).toBe(4)
      else if (i === 2) expect(e).toBe(6)
    }
    let subscription3 = (e) => {
      fail()
    }
    let s = new DataSubscription(d, subscription1)

    s.subscription(subscription2)
    d.set(6)
    s.subscription(subscription3, false)
  })


  test("Data change", () => {
    let d = new Data(4)
    let i = 0

    expect.assertions(4)
    let subscription1 = (e) => {
      i++
      if (i === 1) expect(e).toBe(4)
      else if (i === 2) expect(e).toBe(6)
      else if (i === 3) expect(e).toBe(7)
      else if (i === 4) expect(e).toBe(23)
      else if (i === 5) fail()
    }
    let s = new DataSubscription(d, subscription1)

    let d2 = new Data(4)
    s.data(d2)
    d.set(231321)
    d.set(23)
    d.set(23)
    d2.set(6)
    d2.set(6)
    d2.set(7)
    s.data(d)
    d2.set(231321)
    d2.set(23)
    d2.set(23)
    d.set(23)
    d.set(23)
    d2.set(23)
    s.data(d2)
  })


  test("Multiple instances of same DataSet & Subsciption active coherence", () => {
    let d = new Data(4)

    expect.assertions(4)
    let i = 0
    let subscription1 = (e) => {
      i++
      if (i === 1) expect(e).toBe(4)
      else if (i === 2) expect(e).toBe(5)
      else if (i === 3) expect(e).toBe(6)
      else if (i === 4) expect(e).toBe(2)
      else if (i === 5) fail()
    } 
    let s1 = new DataSubscription(d, subscription1)
    let s2 = new DataSubscription(d, subscription1)

    s1.active(false)
    d.set(123)
    s2.active(false)
    d.set(4)
    s2.active(true)
    s2.activate()
    s2.activate()
    d.set(5)
    s1.deactivate()
    s1.deactivate()
    s1.active(false)
    d.set(6)
    s1.active(!s2.active())
    s2.deactivate()
    d.set(0)
    d.set(2)
    s1.activate()
    d.set(2)
  })
})


describe("DataCollection", () => {
  test("Data support", () => {
    let d1 = new Data(1)
    let d2 = new Data(2)

    let d = new DataCollection(d1, d2)
    d.get((...a) => {
      expect(a).toEqual([1, 2])
    })
  })

  test("DataCollection support", () => {
    let d1 = new Data(1)
    let d2 = new Data("2")
    let dd = new DataCollection(d1, d2)
    let d3 = new Data(3)
    let d4 = new Data("4")

    let ddd = new DataCollection(dd, d3, d4)
    ddd.get((...a) => {
      expect(a).toEqual([[1, "2"], 3, "4"])
    })
  })

  test("Dont Initialize", () => {
    let d1 = new Data(1)
    let d2 = new Data(2)

    let d = new DataCollection(d1, d2)
    d.get((...a) => {
      fail()
    }, false)
  })

  test("Current Value", () => {
    let d1 = new Data(1)
    let d2 = new Data(2)
    let d3 = new Data("333")

    let d = new DataCollection(d1, d2, d3)
    expect(d.get()).toEqual([1, 2, "333"])
  })

  test("Subscription any value change", () => {
    let d1 = new Data(1)
    let d2 = new Data(2)

    let d = new DataCollection(d1, d2)

    let i = 0
    expect.assertions(3)
    d.get((...a) => {
      i++
      if (i === 1) {
        expect(a).toEqual([1, 2])
      }
      else if (i === 2) {
        expect(a).toEqual([100, 2])
      }
      else if (i === 3) {
        expect(a).toEqual([100, 20])
      }
    })


    d1.set(100)
    d2.set(20)
  })

  test("Unsubscribe Vanilla", () => {
    let d1 = new Data(1)
    let d2 = new Data(2)

    let d = new DataCollection(d1, d2)

    let i = 0
    expect.assertions(2)
    let f = (...a) => {
      i++
      if (i === 1) {
        expect(a).toEqual([1, 2])
      }
      else if (i === 2) {
        expect(a).toEqual([100, 2])
      }
      else if (i === 3) {
        fail()
      }
    }

    d.get(f)


    d1.set(100)
    d.got(f)
    d1.set(2000)
    d2.set(2000)
  })

  test("Unsubscribe via DataSubscription", () => {
    let d1 = new Data(1)
    let d2 = new Data(2)

    let d = new DataCollection(d1, d2)

    expect.assertions(3)
    let i = 0
    let me = d.get((...a) => {
      i++
      if (i === 1) {
        expect(a).toEqual([1, 2])
      }
      else if (i === 2) {
        expect(a).toEqual([100, 2])
      }
      else if (i === 3) {
        expect(a).toEqual([1000, 2000])
      }
      else if (i === 4) {
        fail()
      }
    })


    d1.set(100)
    d.got(me)
    d1.set(2000)
    d2.set(2000)
    d.get(me, false)
    d1.set(1000)
  })
})



describe("DataBase", () => {
  test("Init and set and get", () => {
    const db = new DataBase({lel: 2})
    expect(db).toBeInstanceOf(DataBase)
    expect(db()).eq({lel: 2})
    const setRet = db({lel: 3})
    expect(setRet).toBeInstanceOf(DataBase)
    expect(setRet).toBe(db)
    expect(db()).eq({lel: 3})
    const store = db()
    db({lul: 4})
    expect(store).eq({lel: 3, lul: 4})
    expect(db()).eq({lel: 3, lul: 4})
    db({l1: 1, l2: 2})
    expect(db()).eq({lel: 3, lul: 4, l1: 1, l2: 2})
    db({l3: 3}, true)
    expect(db()).eq({l3: 3})

    const dd = db as any
    expect(dd.l3).toBeInstanceOf(Data)
    expect(dd.l3.get()).toBe(3)
    expect(dd.l2).toBe(undefined)
    dd.l3.set("woo")
    expect(dd.l3.get()).toBe("woo")
    expect(db()).eq({l3: "woo"})
    expect(store).eq({l3: "woo"})
  })

  test("Deep DB", () => {
    const db = new DataBase({flat: 1, deep: {deeper: 2}}) as any
    expect(db.deep.deeper.get()).toBe(2)
    expect(db.deep.deeper).toBeInstanceOf(Data)
    expect(db.deep).toBeInstanceOf(DataBase)
    db({deep: {lel: 2}})
    expect(db()).eq({flat: 1, deep: {deeper: 2, lel: 2}})
    expect(db.deep()).eq({deeper: 2, lel: 2})
    expect(db.flat).toBeInstanceOf(Data)
    expect(db.flat.get()).toBe(1)
    db.deep({deeper: 3})
    expect(db()).eq({flat: 1, deep: {deeper: 3, lel: 2}})
    db.deep({deeper: 4}, true)
    expect(db()).eq({flat: 1, deep: {deeper: 4}})
    db({deep: {deeper: 5}}, true)
    expect(db()).eq({deep: {deeper: 5}})
  })

  describe("Recursion", () => {
    test("Recursive DB", () => {
      const ob = {
        ppl: {
          name: "max",
          age: 22,
          likes: {
            name: "lela",
            age: 21
          }
        }
      };
      (ob.ppl.likes as any).likes = ob.ppl
      // console.log(ob)
  
      const db = new DataBase(ob) as any
      // console.log(clone(db()))
      expect(db.ppl.name.get()).toBe("max")
      expect(db.ppl.age.get()).toBe(22)
  
      expect(db.ppl.likes.likes.age.get()).toBe(22)
      expect(db.ppl.likes.likes.name.get()).toBe("max")
      db({ppl: {name: "marx"}})
      expect(db.ppl.name.get()).toBe("marx")
      expect(db.ppl.likes.likes.name.get()).toBe("marx")
      db.ppl.name.set("marxx")
      expect(db.ppl.name.get()).toBe("marxx")
      expect(db.ppl.likes.likes.name.get()).toBe("marxx")
      expect(db.ppl.likes.likes.likes.likes.name.get()).toBe("marxx")
      expect(db.ppl.likes.likes.likes.likes.likes.name.get()).toBe("lela")
      expect(db.ppl.likes.likes.likes.likes.likes().age).toBe(21)
      db({lela: db().ppl.likes})
      db({lela: {age: 22}})
      expect(db.ppl.likes.likes.likes.likes.likes().age).toBe(22)
    })

    test("Add recursive structur at runtime", () => {

      const ob = {
        ppl: {
          name: "max",
          age: 22,
          likes: {
            name: "lela",
            age: 21
          }
        }
      };
      (ob.ppl.likes as any).likes = ob.ppl
      // console.log(ob)
  
      const db = new DataBase(ob) as any


      const ob2 = {
        ppl: {
          name: "linda",
          age: 30,
          likes: {
            name: "binda",
            age: 31
          }
        }
      };

      (ob2.ppl.likes as any).likes = ob2.ppl;
      ((ob2.ppl as any).root as any) = ob2;
      ((ob2.ppl.likes as any).root as any) = ob2;

      db({ob2})


      expect(db.ob2.ppl.likes.likes.name.get()).toBe("linda")
      expect(db.ob2.ppl.likes.likes.likes.name.get()).toBe("binda")
    })

    test("Add recursion at runtime", () => {
      const ob = {
        ppl: {
          name: "max",
          age: 22,
          likes: {
            name: "lela",
            age: 21
          }
        }
      };
  
      const db = new DataBase(ob) as any

      db({ppl: {likes: {likes: db().ppl}}})
      

      expect(db.ppl.likes.likes.name.get()).toBe("max")
      expect(db.ppl.likes.likes.age.get()).toBe(22)
      expect(db.ppl.likes.likes.likes.name.get()).toBe("lela")
      expect(db.ppl.likes.likes.likes.likes.likes.name.get()).toBe("lela")



      expect(db.ppl2).toBe(undefined)
      db({ppl2: db.ppl()})
      expect(db.ppl2()).eq(clone(db.ppl()))
      expect(db.ppl2.likes.likes.name.get()).toBe("max")
      expect(db.ppl2.likes.likes.age.get()).toBe(22)
      expect(db.ppl2.likes.likes.likes.name.get()).toBe("lela")
      expect(db.ppl2.likes.likes.likes.likes.likes.name.get()).toBe("lela")


      // TODO?
      // db({ppl: {likes: {likes: db.ppl}}})
    })
  
  
      
    test("Add intersection rectursive structure", () => {
      const ob = {
        ppl: {
          name: "max",
          age: 22,
          likes: {
            name: "lela",
            age: 21
          }
        }
      };
      (ob.ppl.likes as any).likes = ob.ppl
      // console.log(ob)


      
  
      const db = new DataBase(ob) as any


      const ob2 = {
        ppl: {
          name: "linda",
          age: 30,
          likes: {
            name: "binda",
            age: 31
          }
        }
      };

      (ob2.ppl.likes as any).likes = ob2.ppl;
      ((ob2.ppl as any).root as any) = ob2;
      ((ob2.ppl.likes as any).root as any) = ob2;

      db({ob2})


  
      const ob3 = {
        ppl: {
          name3: "winda",
          age3: 30,
          likes: {
            name3: "rinda",
            age3: 31
          }
        }
      };

      
  
      db({ob2: ob3})

      expect(db.ob2.ppl.likes.likes.name.get()).toBe("linda")
      expect(db.ob2.ppl.likes.likes.likes.name.get()).toBe("binda")

      expect(db.ob2.ppl.likes.likes.name3.get()).toBe("winda")
      expect(db.ob2.ppl.likes.likes.likes.name3.get()).toBe("rinda")





      const ob4 = {
        ppl: {
          name4: "winda2",
          age3: 111,
          likes: {
            name4: "rinda2",
            age4: 31
          }
        }
      };

      (ob4.ppl.likes as any).likes = ob4.ppl;
  
      db({ob2: ob4})

      expect(db.ob2.ppl.likes.likes.name.get()).toBe("linda")
      expect(db.ob2.ppl.likes.likes.likes.name.get()).toBe("binda")

      expect(db.ob2.ppl.likes.likes.name3.get()).toBe("winda")
      expect(db.ob2.ppl.likes.likes.likes.name3.get()).toBe("rinda")

      expect(db.ob2.ppl.likes.likes.name4.get()).toBe("winda2")
      expect(db.ob2.ppl.likes.likes.likes.name4.get()).toBe("rinda2")

      expect(db.ob2.ppl.likes.likes.age3.get()).toBe(111)
      
    })

    describe("Callbacks", () => {
      test("Recieve full at root", () => {
        const ob = {
          ppl: {
            name: "max",
            age: 22,
            likes: {
              name: "lela",
              age: 21
            }
          }
        };
        (ob.ppl.likes as any).likes = ob.ppl
        // console.log(ob)
    
        const db = new DataBase(ob) as any

        const mut = itrMut(ob)
  
        const e = expect([
          mut(), 
          mut({ppl: {name: "max2"}}),
          mut({ppl: {likes: {name: "lela2"}}}),
          mut({ppl: {age: 212, likes: {age: 212}}}),
          mut({ppl: {likes: {likes: {name: "lela3"}}}}),
          (() => {const m = mut(); delete m.ppl.likes; return m})(),
          (() => {const m = mut(); delete m.ppl.likes; delete m.ppl.name; return m})(),
        ])
  
        db((full) => {
          e.inOrder(full)
        })

        const ppl = db.ppl

        ppl.name.set("max2")
        ppl.likes.name.set("lela2")
        ppl({age: 212, likes: {age: 212}})
        db({ppl: {likes: {likes: {name: "lela3"}}}})
        ppl({likes: undefined})
        ppl({name: undefined})
      })
    })



    
  
  })

})


function mockMut(ob: object) {
  const oob = clone(ob)
  return function mut(changes: any = {}, ooob = oob) {
    const o = clone(ooob)
    for (const key in changes) {
      if (typeof changes[key] === "object" && typeof o[key] === "object") changes[key] = mut(changes[key], o[key])
      else o[key] = changes[key]
    }
    return o
  }
}

function itrMut(ob: object) {
  const oob = clone(ob)
  return function mut(changes: any = {}, o = oob) {
    for (const key in changes) {
      if (typeof changes[key] === "object" && typeof o[key] === "object") mut(changes[key], o[key])
      else o[key] = changes[key]
    }
    return clone(o)
  }
}

function editOb() {

}