export { setDataDerivativeIndex, OptionallyExtendedData, OptionallyExtendedDataBase } from "./derivativeExtension"
export { Data, DataBaseSubscription, DataSubscription } from "./dataDerivable"
export { DataCollection } from "./dataCollection"
export { DataBase, parsingId as dataBaseParsingId, internalDataBaseBridge } from "./dataBaseDerivable"
export { instanceTypeSym, instanceTypeLink } from "./data"


import { Data } from "./dataDerivable"
export type ReadonlyData<T> = Omit<Data<T>, "set">
