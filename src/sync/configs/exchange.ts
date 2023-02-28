
import { getABI, getspotAddress } from "../../utils/utils";
import { getExchangeAddress } from "../../helper/chain";
import { handleFeesSet } from "../../handlers/handleFeeSet";
import { handleMinTokenAmountSet } from "../../handlers/handleMinTokenAmountSet";
import { handleOrderExecuted } from "../../handlers/orderExecuted";
import { handleOrderCancelled } from "../../handlers/orderCancelled";
import { handleMarginEnabled } from "../../handlers/marginEnabled";
import fs from "fs";
import path from "path";




function ExchangeConfig(chainId: string) {
    return getspotAddress(chainId).map((x) => {
        return {
            contractAddress: x,
            abi: getABI("Spot"),
            handlers: {
                "OpenPosition": handleOrderExecuted,
                "ClosePosition": handleOrderExecuted,
                "LimitOrderFilled": handleOrderExecuted,
                "OrderCancelled": handleOrderCancelled,
            },
            chainId: chainId
        }
    })
    // return {
    //     contractAddress: getExchangeAddress(chainId),
    //     abi: getABI("Spot"),
    //     handlers: {
    //         "OpenPosition": handleOrderExecuted,
    //         "ClosePosition": handleOrderExecuted,
    //         "LimitOrderFilled": handleOrderExecuted,
    //         "OrderCancelled": handleOrderCancelled,
    //         // "MarginEnabled": handleMarginEnabled,
    //         // "FeesSet": handleFeesSet,
    //         // "MinTokenAmountSet": handleMinTokenAmountSet
    //     },
    //     chainId: chainId
    // };
}

// console.log(ExchangeConfig("421613"))
export { ExchangeConfig };
