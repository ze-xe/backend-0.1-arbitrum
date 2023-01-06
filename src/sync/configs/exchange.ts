
import { getExchangeABI } from "../../utils/utils";

import { handleOrderExecuted, handleOrderCancelled, handleMarginEnabled } from "../../handlers/exchange";
import { getExchangeAddress } from "../../helper/chain";
import { handleFeesSet } from "../../handlers/handleFeeSet";
import { handleMinTokenAmountSet } from "../../handlers/handleMinTokenAmountSet";





function ExchangeConfig(chainId: string) {

    return {
        contractAddress: getExchangeAddress(chainId),
        abi: getExchangeABI(),
        handlers: {
            "OrderExecuted": handleOrderExecuted,
            "OrderCancelled": handleOrderCancelled,
            "MarginEnabled": handleMarginEnabled,
            "FeesSet": handleFeesSet,
            "MinTokenAmountSet": handleMinTokenAmountSet
        },
        chainId: chainId
    };
}



export { ExchangeConfig };
