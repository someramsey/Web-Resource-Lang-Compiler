import { MetaData } from "../meta";

export type StringMetaData = MetaData<"string", string>;
export type NumberMetaData = MetaData<"number", number>;
export type HexMetaData = MetaData<"hex", string>;

export type PrimeMetaData = StringMetaData | NumberMetaData | HexMetaData;