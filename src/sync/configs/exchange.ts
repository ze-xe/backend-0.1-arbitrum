import { getExchangeAddress } from "../../utils";
import { getExchangeABI } from "../../utils";

import { handleOrderExecuted, handleOrderCancelled } from "../../handlers/exchange";





function ExchangeConfig(chainId : string) {

    return {
        contractAddress: getExchangeAddress(chainId),
        abi: getExchangeABI(),
        handlers: {
            "OrderExecuted": handleOrderExecuted,
            "OrderCancelled": handleOrderCancelled
        },
        chainId: chainId
    };
}



export { ExchangeConfig };
