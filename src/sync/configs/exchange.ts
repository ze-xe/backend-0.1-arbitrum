
import { getExchangeABI } from "../../utils/utils";
import { getExchangeAddress } from "../../helper/chain";
import { handleFeesSet } from "../../handlers/handleFeeSet";
import { handleMinTokenAmountSet } from "../../handlers/handleMinTokenAmountSet";
import { handleOrderExecuted } from "../../handlers/orderExecuted";
import { handleOrderCancelled } from "../../handlers/orderCancelled";
import { handleMarginEnabled } from "../../handlers/marginEnabled";





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
