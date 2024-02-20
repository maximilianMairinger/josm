import { Data, DataSubscription, DataCollection, DataBase } from "../../app/src/josm"
import delay from "delay"




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

  // null and undefined must be defined
  // probably we should respect the valueof Data?
  test("Set values are truthy", () => {
    const db = new DataBase({
      a: 0,
      b: "sd",
      c: false,
      d: 1,
      e: {
        a: 0,
      }
    })

    expect(!!db.a).toBe(true)
    expect(!!db.b).toBe(true)
    expect(!!db.c).toBe(true)
    expect(!!db.d).toBe(true)
    expect(!!db.e).toBe(true)

  })

  test("Set and then unset values are falsy", () => {
    const db = new DataBase({
      a: 0,
      b: "sd",
      c: false,
      d: 1,
      e: {
        a: 0,
      },
      f: {
        a: 0
      }
    })

    db({a: undefined})
    db({b: undefined})
    db({c: undefined})
    db({d: undefined})
    db({e: undefined})
    db({f: {a: undefined}})


    expect(!!db.a).toBe(false)
    expect(!!db.b).toBe(false)
    expect(!!db.c).toBe(false)
    expect(!!db.d).toBe(false)
    expect(!!db.e).toBe(false)
    expect(!!db.f).toBe(true)
    expect(!!db.f.a).toBe(false)
  })

  describe("Cyclic", () => {
    test("Init with cyclic", () => {
      const srcOb = {a: {b: 2}, c: "cc"} as any
      srcOb.a.d = srcOb
      const val = new DataBase(srcOb) as any
      expect(val.a.d.a.b.get()).toBe(2)
    })

    test("Latent cyclic", () => {
      const srcOb = {a: {b: 2}, c: "cc"} as any
      
      const val = new DataBase(srcOb) as any

      val.a({d: srcOb})

      expect(val.a.d.a.b.get()).toBe(2)
    })
  })
})