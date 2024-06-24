import { Node } from "../processors/transformer";


type Expression = {};
type AssignmentInstruction = {
    kind: "assignment";
    id: string;
    value: Node;
};
export type Instruction = AssignmentInstruction;
