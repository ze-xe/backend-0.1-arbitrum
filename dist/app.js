"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./src/db");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const orderRoute_1 = __importDefault(require("./src/routes/orderRoute"));
const pairRoutes_1 = __importDefault(require("./src/routes/pairRoutes"));
const userRoute_1 = __importDefault(require("./src/routes/userRoute"));
const helmet_1 = __importDefault(require("helmet"));
const appUtil_1 = require("./src/appUtil");
require("dotenv").config();
db_1.backupConnection;
(0, db_1.connect)();
app.use((0, cors_1.default)({
    origin: ["https://zexe.io", "http://localhost:3000"]
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use("/pair", pairRoutes_1.default);
app.use("/user", userRoute_1.default);
app.use(orderRoute_1.default);
function run(chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            (0, appUtil_1.start)(chainId);
        }
        catch (error) {
            console.log("Error @ run", error);
        }
    });
}
run("421613");
app.listen(process.env.PORT || 3010, function () {
    console.log("app running on port " + (process.env.PORT || 3010));
});
