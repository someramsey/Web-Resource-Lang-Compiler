export type Property<T> = { key: string; value: T; }

export type BlockMetaData<T> = MetaData<"block", Property<T>[]>;
export type ArrayMetaData<T> = MetaData<"array", T>;
export type GroupMetaData<T> = MetaData<"group", T>;

export type StringMetaData = MetaData<"string", string>;
export type NumberMetaData = MetaData<"number", number>;

export type CompoundMetaData<T = any> = BlockMetaData<T> | ArrayMetaData<T> | GroupMetaData<T>;
export type PrimeMetaData = StringMetaData | NumberMetaData;

export type MetaData<Meta extends string = string, Value = any> = {
    meta: Meta;
    value: Value;
};
