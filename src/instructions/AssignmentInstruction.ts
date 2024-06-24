import { ValueToken } from "../processors/tokenizer";


type LiteralExpression = {
    kind: "literal";


    
    
};

type ReferenceExpression = {
    kind: "reference";
    target: string;
};

type AccessorExpression = {
    kind: "accessor";
    query: ValueExpression;
};

export type ValueExpression = LiteralExpression | ReferenceExpression;
export type ExpressionFragment = ValueExpression | AccessorExpression;

export type AssignmentInstruction = {
    kind: "assignment";
    id: string;
    expression: ExpressionFragment[];
};
