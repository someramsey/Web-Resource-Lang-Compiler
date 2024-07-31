export * from "./prime"
export * from "./compound"

export type MetaData<Meta extends string = string, Value = any> = {
    meta: Meta;
    value: Value;
};