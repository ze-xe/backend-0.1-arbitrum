
import { getExchangeABI } from "../../utils";

import { handleOrderExecuted, handleOrderCancelled, handleMarginEnabled } from "../../handlers/exchange";
import { getExchangeAddress } from "../../helper/chain";





function ExchangeConfig(chainId : string) {

    return {
        contractAddress: getExchangeAddress(chainId),
        abi: getExchangeABI(),
        handlers: {
            "OrderExecuted": handleOrderExecuted,
            "OrderCancelled": handleOrderCancelled,
            "MarginEnabled": handleMarginEnabled,
            // "MinTokenAmountSet"
        },
        chainId: chainId
    };
}



export { ExchangeConfig };
