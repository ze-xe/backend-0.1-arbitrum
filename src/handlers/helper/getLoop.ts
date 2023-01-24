import Big from "big.js";










export function loopFillAmount(amount: string, borrowLimit: any, loop: any) {

    for (let i = 0; i < loop; i++) {
        amount = Big(amount).times(borrowLimit).div(10 ** 6).toString();
    }
    return amount;
}





export function getLoop(totalSum: string, borrowLimit: string, orderAmount: string) {

    borrowLimit = Big(borrowLimit).div(1e6).toString();
    let temp1 = Big(
        Big(-1)
            .times(
                Big(totalSum).times(Big(1).minus(borrowLimit)
                ).plus(
                    Big(orderAmount).times(Big(1).minus(borrowLimit))
                ).minus(orderAmount)
            )).div(orderAmount).toNumber()

    let loop = Big(Math.log(temp1)).div(Big(Math.log(+borrowLimit))).minus(1).toString();

    return loop
}


// formula for calculating loop
// let temp = Math.log(-(s * (1 - x) + a * (1 - x) - a) / a)
// n = temp / Math.log(x);
// console.log(n)


