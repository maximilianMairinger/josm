import { Data } from "./data"

// new<T extends E> (...a: any[]): Data<E>, 


// type InferIt<T extends DataDerivativeCollectionClasses<E>, E extends unknown[]> = T extends DataDerivativeCollectionClasses<infer I> ? I : never




type OptinallyExtendedData<E extends unknown[], W extends { [key in keyof E]: { type: E[key], new(a: any): Data<E[key]> } }> = {
  new<T>(a: T): ({
    [key in (keyof E)]: T extends E[key] ? InstanceType<W[key]> : Data<T>
  }[number])
}


function f<E extends unknown[], W extends { [key in keyof E]: { type: E[key], new(a: any): Data<E[key]> } }>(...t: { [key in keyof E]: {type: E[key]} } & W): OptinallyExtendedData<E, W> {
  return t as any
}

const eee = f(
  class NumberData extends Data<number> {
    static type: number;
    inc(by: number) {

    }
  }
)


const ww = new eee(2)





