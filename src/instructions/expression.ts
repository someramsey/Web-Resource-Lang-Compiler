import { CompoundMetaData, PrimeMetaData } from "../meta";

type ExpressionMetaData = PrimeMetaData | CompoundMetaData<Expression>;

type LiteralExpressionFragment = {
    kind: "literal";
    data: ExpressionMetaData;
};

type IdentifierExpressionFragment = {
    kind: "reference" | "accessor";
    target: string;
};

export type ExpressionFragment = LiteralExpressionFragment | IdentifierExpressionFragment;

export type Expression = ExpressionFragment[];
