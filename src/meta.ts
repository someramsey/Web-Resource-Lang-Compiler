import { Expression } from "./expression";

export type Property = { key: string; expression: Expression; }
export type ArrayItem = { kind: "range", inclusive: boolean, from: Expression, to: Expression } | { kind: "single", expression: Expression };

export type BlockMetaData = MetaData<"block", Property[]>;
export type ArrayMetaData = MetaData<"array", ArrayItem[]>;
export type GroupMetaData = MetaData<"group", Expression>;

export type StringMetaData = MetaData<"string", string>;
export type NumberMetaData = MetaData<"number", number>;
export type HexMetaData = MetaData<"hex", string>;

export type CompoundMetaData = BlockMetaData | ArrayMetaData | GroupMetaData;
export type PrimeMetaData = StringMetaData | NumberMetaData | HexMetaData;

export type MetaData<Meta extends string = string, Value = any> = {
    meta: Meta;
    value: Value;
};
