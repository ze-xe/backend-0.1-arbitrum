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
/*
let a = Big("1000000000000000000");
// let a = Big("10000").times("1")//.div(Big(10).pow(18));
let x = Big(0.75);
let loop = Number(5);
let amount1 = Big(0);
for (let i = 0; i < loop; i++) {
    amount1 = Big(amount1).plus(Big(a).times(Big(x).pow(i+1)))
};

console.log(amount1.toString())
let n = 6
// console.log(a*((r*n – 1)/(r – 1)))

// let s = Big(a).times(((Big(x).pow(n)).minus(1)).div(Big(x).minus(1))).minus(a).toString()
let s = Big(a).times((Big(1).minus(Big(x).pow(n))).div(Big(1).minus(x))).minus(a).toString()
console.log(s)
*/
// console.log(Big(s).div(a).toString())


function scaledByBorrowLimit(amount: any, borrowLimit: any, loop: any) {

    for (let i = 0; i < loop; i++) {
        amount = Big(amount).times(borrowLimit).div(10 ** 6);
    }
    console.log((amount).toString())
    return amount;
}

scaledByBorrowLimit(1000000000000000000, 750000, 3)

// console.log("total amount", (0.75+0.5625-1))
// console.log("total balance", (0.75+0.5625-1)*20000);

0.5-0.3

let n;
let a = 1000000000000000000
let x = 0.75;
let s = 1670000000000000000


let temp = Math.log(-(s * (1 - x) + a * (1 - x) - a) / a)

n = temp / Math.log(x);
console.log(--n)

let temp1 = Big(
    Big(-1)
        .times(
            Big(s).times(Big(1).minus(x)
            ).plus(
                Big(a).times(Big(1).minus(x))
            ).minus(a)
        )).div(a).toNumber()

n = Big(Math.log(temp1)).div(Big(Math.log(x))).minus(1).toNumber().toFixed(4)


console.log(n)
console.log(421875000000000000*(0.8275)*20000)