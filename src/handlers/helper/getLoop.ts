import Big from "big.js";










export function loopFillAmount(amount: string, borrowLimit: any, loop: any) {

    for (let i = 0; i < loop; i++) {
        amount = Big(amount).times(borrowLimit).div(10 ** 6).toString();
    }
    return amount;
}

//  scaledByBorrowLimit("1000000000000000000", "750000", "2")

// console.log("total amount", (0.75+0.5625-1))
// console.log("total balance", (0.75+0.5625-1)*20000);

// 0.5-0.3

// let n;
// let a = 1000000000000000000
// let x = 0.75;
// let s = 1000000000000000000


// let temp = Math.log(-(s * (1 - x) + a * (1 - x) - a) / a)

// n = temp / Math.log(x);
// console.log(n)


export function getLoop(totalSum:string,borrowLimit: string,orderAmount: string){

    borrowLimit = Big(borrowLimit).div(1e6).toString();
    let temp1 = Big(
        Big(-1)
            .times(
                Big(totalSum).times(Big(1).minus(borrowLimit)
                ).plus(
                    Big(orderAmount).times(Big(1).minus(borrowLimit))
                ).minus(orderAmount)
            )).div(orderAmount).toNumber()
    
    let loop = Big(Math.log(temp1)).div(Big(Math.log(+borrowLimit))).minus(1).toNumber().toFixed(4);

    return loop
}

// getLoop('1000000000000000000',"750000", "1000000000000000000" )
