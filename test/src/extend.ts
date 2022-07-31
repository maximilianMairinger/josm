import expectOrdered from "jest-expect-ordered"


import { circularDeepEqual } from "fast-equals"
import clone from "./../../app/src/lib/clone"

declare global {
  namespace jest {
    interface Matchers<R, T> {
      eq(got: any): CustomMatcherResult
    }
  }
}


function eq(exp, got) {
  return {
    pass: exp === got || circularDeepEqual(clone(exp), clone(got)),
    message: () => `Expected ${this.utils.printReceived(clone(exp))} to be depply equal to ${this.utils.printExpected(clone(got))}`,
  }
}


expect.extend({
  ...expectOrdered,
  eq
  
})