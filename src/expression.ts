import { NodeMetaData } from "./processors/transformer";

//Expression extenders
export type AcessorExpression = { kind: "acessor"; name: string; };
export type IndexerExpression = { kind: "indexer"; expression: Expression; };

export type ExpressionExtender = AcessorExpression | IndexerExpression;

//Expressions
export type ReferenceExpression = { kind: "reference"; name: string; extenders: ExpressionExtender[]; };
export type ValueLiteralExpression = { kind: "literal"; data: NodeMetaData; };

export type Expression = ReferenceExpression | ValueLiteralExpression;