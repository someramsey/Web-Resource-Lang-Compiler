import { NodeMetaData } from "./meta";
import { Range } from "./range";

//Expression extenders
export type AcessorExpression = { kind: "acessor"; name: string; };
export type IndexerExpression = { kind: "indexer"; expression: UnresolvedExpression; };

export type ExpressionExtender = AcessorExpression | IndexerExpression;

//Expressions
export type ReferenceExpression = {
    kind: "reference";
    name: string;
    extenders: ExpressionExtender[];
    range: Range;
};

export interface ValueLiteralExpression<T extends NodeMetaData<Expression>> {
    kind: "literal";
    data: T;
    range: Range;
}

export type ResolvedExpression = { data: NodeMetaData<ResolvedExpression> };
export type UnresolvedExpression = ReferenceExpression | ValueLiteralExpression<NodeMetaData<UnresolvedExpression>>

export type Expression = UnresolvedExpression | ResolvedExpression;