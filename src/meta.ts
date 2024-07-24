import { Expression } from "./expression";

export type Property<T extends Expression> = { key: string; expression: T; }
export type ArrayItem<T extends Expression> = { kind: "range", inclusive: boolean, from: T, to: T, steps: number | "unset" } | { kind: "single", expression: T };

export type BlockMetaData<T extends Expression> = MetaData<"block", Property<T>[]>;
export type ArrayMetaData<T extends Expression> = MetaData<"array", ArrayItem<T>[]>;
export type GroupMetaData<T extends Expression> = MetaData<"group", T>;

export type StringMetaData = MetaData<"string", string>;
export type NumberMetaData = MetaData<"number", number>;
export type HexMetaData = MetaData<"hex", string>;

export type PrimeMetaData = StringMetaData | NumberMetaData | HexMetaData;
export type CompoundMetaData<T extends Expression> = BlockMetaData<T> | ArrayMetaData<T> | GroupMetaData<T>;
export type NodeMetaData<T extends Expression> = PrimeMetaData | CompoundMetaData<T>;

export type MetaData<Meta extends string = string, Value = any> = {
    meta: Meta;
    value: Value;
};