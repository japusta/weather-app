"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = require("./App");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
new App_1.App().start();
