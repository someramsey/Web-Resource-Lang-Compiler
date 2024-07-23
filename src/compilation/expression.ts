import { NodeMetaData } from "./processors/transformer";

//Expression extenders
export type AcessorExpression = { kind: "acessor"; name: string; };
export type IndexerExpression = { kind: "indexer"; expression: UnresolvedExpression; };

export type ExpressionExtender = AcessorExpression | IndexerExpression;

//Expressions
export type ReferenceExpression = { kind: "reference"; name: string; extenders: ExpressionExtender[]; };
export interface ValueLiteralExpression<T extends NodeMetaData<Expression>> {
    kind: "literal";
    data: T;
}


export type UnresolvedExpression = ReferenceExpression | ValueLiteralExpression<NodeMetaData<UnresolvedExpression>>;
export type ResolvedExpression = ValueLiteralExpression<NodeMetaData<ResolvedExpression>>

export type Expression = UnresolvedExpression | ResolvedExpression;