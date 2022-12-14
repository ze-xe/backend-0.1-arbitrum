"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
// import { server } from "../../offchain_routes";
const socket_io_1 = require("socket.io");
class SocketService {
    init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: "*"
            }
        });
        console.log("WS Initialized");
        this.on("connection", (socket) => {
            console.log("New client connected", socket.id);
            socket.on("disconnect", () => console.log("Client disconnected", socket.id));
            // socket.on("sync", (address: string)=> {
            //     console.log("New sync request", address)
            //     _startSync(address, supportedChains);
            // })
        });
    }
    on(eventName, callback) {
        this.io.on(eventName, callback);
    }
    emit(eventName, data) {
        this.io.emit(eventName, data);
    }
}
exports.socketService = new SocketService();
