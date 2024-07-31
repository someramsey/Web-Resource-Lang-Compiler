import { MetaData, PrimeMetaData } from "..";
import { Expression } from "../../expression";
import { Ranged } from "../../range";

export type GroupItem = { expression: Expression; } & Ranged;
export type Property = { key: string; expression: Expression; } & Ranged;

export type Interpolation = { steps: number | null; mode: string | null; }
export type ArrayItem = (
    { kind: "range", inclusive: boolean, from: Expression, to: Expression, interpolation: Interpolation } |
    { kind: "single", expression: Expression }
) & Ranged;

export type UnresolvedBlockMetaData = MetaData<"block", Property[]>;
export type UnresolvedArrayMetaData = MetaData<"array", ArrayItem[]>;
export type UnresolvedGroupMetaData = MetaData<"group", GroupItem>;

export type UnresolvedCompoundMetaData = UnresolvedBlockMetaData | UnresolvedArrayMetaData | UnresolvedGroupMetaData;
export type UnresolvedMetaData = PrimeMetaData | UnresolvedCompoundMetaData;