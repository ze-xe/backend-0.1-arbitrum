// import { server } from "../../offchain_routes";
import {Server} from "socket.io"

class SocketService{
    private io: Server = new Server();
    
    public init(server: any){
        this.io = new Server(server, {
            cors: {
              origin: "*"
            }
          });
        console.log("WS Initialized");

        this.on("connection", (socket: any) => {
            console.log("New client connected", socket.id);
            socket.on("disconnect", () => console.log("Client disconnected",socket.id));
            
        });
    }

    public on(eventName: string, callback: (x:any) => void){
        this.io.on(eventName, callback);
    }
    public emit(eventName: string, data: any){
        this.io.emit(eventName, data);
    }
}

// export namespace EVENT_NAME {
//     'PAIR_ORDER';
//     'PAIR_HISTORY';
// }

export const  EVENT_NAME  = {
    PAIR_ORDER: "PAIR_ORDER",
    PAIR_HISTORY: "PAIR_HISTORY",
}

export const socketService = new SocketService();



