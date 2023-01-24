
import {  Order, OrderCreatedBackup } from "../../DB/db";
import Big from "big.js";
import { ethers } from "ethers";
import { createOrderSchema } from "../../helper/validateRequest";
import { mainIPFS } from "../../IPFS/putFiles";
import { errorMessage } from "../../helper/errorMessage";
import { EVENT_NAME, socketService } from "../../socketIo/socket.io";
import { marginValidationAndUserPosition} from "./helper/marginValidationUserPosition";
import * as sentry from "@sentry/node";
import { getPairId } from "./helper/pairId";
import { validationAndUserPosition } from "./helper/validationUserPosition";
import { validateSignature } from "../../utils/validateSignature";
import { getDecimals } from "../../utils/getDecimal";







/**
 * 
 * @dev This api function would create order and store it into data base
 * @notice verify signature,check if data coming from backup, check user inOrder balance, wallet balance, allowance, if pair is not present then create corresponding token and pair
 * @param {*} req.body.signature (string)  
 * @param {*} req.body.data (object) this data will be verify with the signature
 * example  
 * "data" :{
    "maker": "0x103B62f68Da23f20055c572269be67fA7635f2fc",
    "token0": "0x842681C1fA28EF2AA2A4BDE174612e901D2b7827",
    "token1": "0xa50fABf59f2c11fF0F02E7c94A82B442611F37B2",
    "amount": "1000000000000000000",
    "orderType": 0,
    "salt": "12345",
    "exchangeRate": "18000000000000000000000"
    }
 * @param {*} req.body.chainId (string) numeric chainId
 * @param {*} req.body.ipfs (boolean) if it is present that means request is sent from backup 
 * @returns  error with message if any validation fail, if success return order created successfully
 */


export async function handleOrderCreated(req: any, res: any) {
    try {

        let signature: string = req.body.signature?.toLowerCase();
        let data = req.body.data;
        let chainId: string = req.body.chainId;
        let ipfs: boolean | undefined = req.body.ipfs;
        let orderType: number = data.orderType;
        let addresses = [data.maker, data.token0, data.token1];
        data.maker = data.maker?.toLowerCase();
        data.token0 = data.token0?.toLowerCase();
        data.token1 = data.token1?.toLowerCase();

        await createOrderSchema.validateAsync({ createOrderSchemaData: req.body.data, signature: signature, chainId: chainId });
        for (let i in addresses) {

            if (!ethers.utils.isAddress(addresses[i])) {
                console.log(`${errorMessage.address, addresses[i]}`);
                return res.status(400).send({ status: false, error: errorMessage.address });
            }
        }
        // geting exchangeRate decimal
        let exchangeRateDecimals: number | string = Number(getDecimals(data.exchangeRate));

        if (isNaN(exchangeRateDecimals) == true) {
            return res.status(400).send({ status: false, error: exchangeRateDecimals });
        }

        data.exchangeRateDecimals = exchangeRateDecimals;

        let id: string | null = validateSignature(data.maker, signature, data, chainId);

        if (!id) {
            console.log(errorMessage.signature);
            return res.status(400).send({ status: false, error: errorMessage.signature });
        }

        const isOrderPresent = await Order.findOne({ id: id, chainId: chainId }).lean();

        if (isOrderPresent) {
            return res.status(201).send({ status: true, message: "Order Already Created" });
        }

        let amount = Big(data.amount);
        const token1Amount =
            Big(amount)
                .times(data.exchangeRate)
                .div(Big(10).pow(18)).toString();

        data.token1Amount = token1Amount;
        let balanceAmount = amount.toString()

        // if margin Order
        if (orderType == 2 || orderType == 3) {
            let response = await marginValidationAndUserPosition(signature, data, chainId, ipfs)

            if (response.status == false) {
                return res.status(response.statusCode).send({ status: false, error: response.error })
            }
            else if (response.status == true) {
               balanceAmount = response.balanceAmount!
            }
        }

        if (orderType == 1 || orderType == 0){
            let response = await validationAndUserPosition(data, chainId, ipfs);
            if(response.status == false){
                return res.status(response.statusCode).send({status: false, error: response.error})
            }
        }

        let pair = await getPairId(data, chainId);
        if(!pair){
            return res.status(500).send({ status: false, error: errorMessage.server });
        }
        let cid = "";

        let orderCreate = {
            id: id,
            signature: signature,
            pair: pair,
            token0: data.token0,
            token1: data.token1,
            maker: data.maker,
            amount: data.amount,
            salt: data.salt,
            exchangeRate: data.exchangeRate,
            orderType: data.orderType,
            chainId: chainId,
            exchangeRateDecimals: exchangeRateDecimals,
            balanceAmount: balanceAmount,
            active: true,
            deleted: false,
            cid: cid,
            lastInOrderToken0: data.orderType == 2 ? amount : 0,
            lastInOrderToken1: data.orderType == 3 ? token1Amount : 0,
            borrowLimit: data.borrowLimit,
            loops: data.loops,
        }
        if (!ipfs) {

            if (process.env.NODE_ENV?.includes('prod')) {
                cid = await mainIPFS([
                    data,
                    signature,
                    chainId
                ],
                    id
                );
            }

            OrderCreatedBackup.create(orderCreate);
        }

        await Order.create(orderCreate);

        // socket io data
        if (!ipfs) {
            socketService.emit(EVENT_NAME.PAIR_ORDER, {
                amount: data.amount,
                exchangeRate: data.exchangeRate,
                orderType: data.orderType,
                pair: pair
            });
        }

        console.log("Order Created ", "maker ", data.maker, "amount ", data.amount.toString(), id, data.orderType);

        return res.status(201).send({ status: true, message: "Order created successfully" });

    }
    catch (error: any) {

        if (error.isJoi == true) error.status = 422;
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return res.status(error.status).send({ status: false, error: error.message });
    }
}
