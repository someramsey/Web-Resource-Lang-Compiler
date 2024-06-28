import { NodeMetaValue } from "../processors/transformer";

type LiteralExpressionFragment = {
    kind: "literal";
    
};

type IdentifierExpressionFragment = {
    kind: "reference" | "accessor";
    target: string;
};

export type ExpressionFragment = LiteralExpressionFragment | IdentifierExpressionFragment;

export type Expression = ExpressionFragment[];
