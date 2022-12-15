import { io } from "socket.io-client";


export class SocketService {
    public io = io();
    constructor() {
        this.io = io(`http://localhost:3010`);
        console.log(this.io)
        console.log("WS Initialized");
    }
    on(eventName: any, callback: any) {
        this.io.on(eventName, callback);
    }
    emit(eventName: any, data: any) {
        this.io.emit(eventName, data);
    }
}

export const clinetSocketService = new SocketService();