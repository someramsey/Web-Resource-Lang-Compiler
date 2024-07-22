import { NodeMetaData } from "./processors/transformer";

//Expression extenders
export type AcessorExpression = { kind: "acessor"; name: string; };
export type IndexerExpression = { kind: "indexer"; expression: Expression; };

export type ExpressionExtender = AcessorExpression | IndexerExpression;

//Expressions
export type ReferenceExpression = { kind: "reference"; name: string; extenders: ExpressionExtender[]; };
export interface ValueLiteralExpression<T extends NodeMetaData = NodeMetaData> {
    kind: "literal";
    data: T;
}

export type Expression = ReferenceExpression | ValueLiteralExpression;