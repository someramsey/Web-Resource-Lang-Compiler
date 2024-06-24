import { PrimeMetaType } from "../processors/tokenizer";
import { CompoundMetaType } from "../processors/transformer";

type NodeMeta = CompoundMetaType | PrimeMetaType;

export type LiteralExpressionFragment<T extends NodeMeta = NodeMeta> = {
    kind: "literal";
    meta: T["meta"];
    value: T["value"];
};

export type ReferenceExpressionFragment = {
    kind: "reference";
    target: string;
};

export type AccessorExpressionFragment = {
    kind: "accessor";
    query: LiteralExpressionFragment | ReferenceExpressionFragment;
};

export type ExpressionFragment = LiteralExpressionFragment | ReferenceExpressionFragment | AccessorExpressionFragment;

export type AssignmentInstruction = {
    kind: "assignment";
    id: string;
    expression: ExpressionFragment[];
};
