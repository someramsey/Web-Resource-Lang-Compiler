"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const tokenizer_1 = require("./processors/tokenizer");
const transformer_1 = require("./processors/transformer");
const data = fs_1.default.readFileSync("data/.sample", "utf-8");
const tokenizationResult = (0, tokenizer_1.tokenizer)(data);
(0, transformer_1.transformer)(tokenizationResult.output);
while (true)
    ;
