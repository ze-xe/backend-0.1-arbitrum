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
exports.OrderCreatedBackup = exports.backupConnection = exports.UserPosition = exports.Token = exports.OrderExecuted = exports.OrderCreated = exports.PairCreated = exports.connect = exports.Sync = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv").config();
let backupConnection = mongoose_1.default.createConnection(process.env.MONGO_URL1);
exports.backupConnection = backupConnection;
const Sync_1 = __importDefault(require("./schemas/Sync"));
const PairCreated_1 = __importDefault(require("./schemas/PairCreated"));
const OrderCreated_1 = __importDefault(require("./schemas/OrderCreated"));
const OrderExecuted_1 = __importDefault(require("./schemas/OrderExecuted"));
const Token_1 = __importDefault(require("./schemas/Token"));
const UserPosition_1 = __importDefault(require("./schemas/UserPosition"));
const OrderCreatedBackup = backupConnection.model("OrderCreated", OrderCreated_1.default);
exports.OrderCreatedBackup = OrderCreatedBackup;
const Sync = mongoose_1.default.model("Sync", Sync_1.default);
exports.Sync = Sync;
const PairCreated = mongoose_1.default.model("PairCreated", PairCreated_1.default);
exports.PairCreated = PairCreated;
const OrderCreated = mongoose_1.default.model("OrderCreated", OrderCreated_1.default);
exports.OrderCreated = OrderCreated;
const OrderExecuted = mongoose_1.default.model("OrderExecuted", OrderExecuted_1.default);
exports.OrderExecuted = OrderExecuted;
const Token = mongoose_1.default.model("Token", Token_1.default);
exports.Token = Token;
const UserPosition = mongoose_1.default.model("UserPosition", UserPosition_1.default);
exports.UserPosition = UserPosition;
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        mongoose_1.default.connect(process.env.MONGO_URL)
            .then(() => console.log("MongoDb is connected"))
            .catch(err => console.log(err));
    });
}
exports.connect = connect;
