import { Expression } from "../expression";
import { MetaData } from ".";
import { PrimeMetaData } from ".";
import { Ranged } from "../range";

export type GroupItem = { expression: Expression; } & Ranged;
export type Property = { key: string; expression: Expression; } & Ranged;
export type ArrayItemStep = number | "auto";
export type ArrayItem = (
    { kind: "range", inclusive: boolean, from: Expression, to: Expression, steps: ArrayItemStep } |
    { kind: "single", expression: Expression }
) & Ranged;


export type UnresolvedBlockMetaData = MetaData<"block", Property[]>;
export type UnresolvedArrayMetaData = MetaData<"array", ArrayItem[]>;
export type UnresolvedGroupMetaData = MetaData<"group", GroupItem>;

export type UnresolvedCompoundMetaData = UnresolvedBlockMetaData | UnresolvedArrayMetaData | UnresolvedGroupMetaData;
export type UnresolvedMetaData = PrimeMetaData | UnresolvedCompoundMetaData;


export type BlockMetaData = MetaData<"block", { [key: string]: NodeMetaData }>;
export type ArrayMetaData = MetaData<"array", NodeMetaData[]>;
export type GroupMetaData = MetaData<"group", { item: NodeMetaData }>;

export type CompoundMetaData = BlockMetaData | ArrayMetaData | GroupMetaData;
export type NodeMetaData = PrimeMetaData | CompoundMetaData;