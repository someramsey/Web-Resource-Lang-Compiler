import { Expression } from "./expression";

export type AssignmentInstruction = {
    kind: "assignment";
    id: string;
    expression: Expression;
};
