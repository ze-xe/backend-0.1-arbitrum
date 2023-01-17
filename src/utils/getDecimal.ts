import Big from "big.js";








export function getDecimals(exchangeRate: string) {
    let findExchangeRateDecimals: string[] = [];
    let a = Big(exchangeRate).div(Big(10).pow(18)).toString().split(".");

    if (a.length > 1) {
        findExchangeRateDecimals = Big(exchangeRate).div(Big(10).pow(18)).toFixed(20).toString().split(".");
    }
    else {
        findExchangeRateDecimals = a;
    }

    let countInt = findExchangeRateDecimals[0].length;
    let exchangeRateDecimals;
    if (countInt >= 4) {
        exchangeRateDecimals = 2;
    }
    else if (countInt >= 1 && findExchangeRateDecimals[0] != '0') {
        exchangeRateDecimals = 3;
    }

    let count0 = 0;

    for (let i = 0; i < findExchangeRateDecimals[1]?.length ?? 0; i++) {
        if (findExchangeRateDecimals[1][i] == '0') {
            count0++;
        }
        else {
            break;
        }
    }

    let countDecInt = 0;

    for (let i = 0; i < findExchangeRateDecimals[1]?.length ?? 0; i++) {
        if (findExchangeRateDecimals[1][i] != '0') {
            countDecInt++;
        }
        else {
            break;
        }
    }

    if (exchangeRateDecimals && (count0 > exchangeRateDecimals || countDecInt > exchangeRateDecimals)) {

        return `only ${exchangeRateDecimals} decimal acceptable`;

    }
    else if (exchangeRateDecimals && count0 < exchangeRateDecimals && count0 < exchangeRateDecimals) {
        return exchangeRateDecimals;
    }
    else {
        exchangeRateDecimals = count0 + 4;
        for (let i = 0; i < findExchangeRateDecimals[1]?.length ?? 0; i++) {
            if (i <= exchangeRateDecimals - 1) {
                continue;
            }
            else if (findExchangeRateDecimals[1][i] != '0') {
                return `only ${exchangeRateDecimals} decimal acceptable`;
            }

        }
        return exchangeRateDecimals;
    }

}