import { MetaData } from "..";
import { PrimeMetaData } from "../prime";

export type BlockMetaData = MetaData<"block", { [key: string]: NodeMetaData }>;
export type ArrayMetaData = MetaData<"array", NodeMetaData[]>;
export type GroupMetaData = MetaData<"group", { item: NodeMetaData }>;

export type CompoundMetaData = BlockMetaData | ArrayMetaData | GroupMetaData;
export type NodeMetaData = PrimeMetaData | CompoundMetaData;