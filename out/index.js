"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const lexer_1 = require("./processors/lexer");
const data = fs_1.default.readFileSync("data/sample", "utf-8");
console.log((0, lexer_1.lexer)(data));
while (true)
    ;
