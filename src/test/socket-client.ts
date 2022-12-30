import Big from "big.js";
import { io } from "socket.io-client";


// export class SocketService {
//     public io = io();
//     constructor() {
//         this.io = io(`http://localhost:3010`);
//         console.log(this.io)
//         console.log("WS Initialized");
//     }
//     on(eventName: any, callback: any) {
//         this.io.on(eventName, callback);
//     }
//     emit(eventName: any, data: any) {
//         this.io.emit(eventName, data);
//     }
// }

// export const clinetSocketService = new SocketService();

let a = Big("1000000000000000000");
// let a = Big("10000").times("1")//.div(Big(10).pow(18));
let x = Big(0.75);
let loop = Number(5);
let amount1 = Big(0);
for (let i = 0; i <= loop; i++) {
    amount1 = Big(amount1).plus(Big(a).times(Big(x).pow(i+1)))
};

console.log(amount1.toString())
let n = 7
// console.log(a*((r*n – 1)/(r – 1)))

let s = Big(a).times(((Big(x).pow(n)).minus(1)).div(Big(x).minus(1))).minus(a).toString()
console.log(s)

console.log(Big(s).div(a).toString())