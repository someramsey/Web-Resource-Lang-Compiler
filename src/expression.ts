import { UnresolvedMetaData } from "./meta";
import { Ranged } from "./range";

//Expression extenders
export type AcessorExpression = { kind: "acessor"; name: string; };
export type IndexerExpression = { kind: "indexer"; expression: Expression; };

export type ExpressionExtender = AcessorExpression | IndexerExpression;

//Expressions
export interface ReferenceExpression extends Ranged {
    kind: "reference";
    name: string;
    extenders: ExpressionExtender[];
}

export interface ValueLiteralExpression<T extends UnresolvedMetaData = UnresolvedMetaData> extends Ranged {
    kind: "literal";
    data: T;
};

export type Expression = ReferenceExpression | ValueLiteralExpression<UnresolvedMetaData>;