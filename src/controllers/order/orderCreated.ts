
import { Order, OrderCreatedBackup } from "../../DB/db";
import Big from "big.js";
import { ethers } from "ethers";
import { createOrderSchema } from "../../helper/validateRequest";
import { mainIPFS } from "../../IPFS/putFiles";
import { errorMessage } from "../../helper/errorMessage";
import { EVENT_NAME, socketService } from "../../socketIo/socket.io";
import { Action, marginValidationAndUserPosition } from "./helper/marginValidationUserPosition";
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
        let spotAddress = req.body.spotAddress.toLowerCase();
        let name = req.body.name;
        let version = req.body.version;
        let addresses = [data.maker, data.token0, data.token1, spotAddress];
        data.maker = data.maker?.toLowerCase();
        data.token0 = data.token0?.toLowerCase();
        data.token1 = data.token1?.toLowerCase();

        // await createOrderSchema.validateAsync({ createOrderSchemaData: req.body.data, signature: signature, chainId: chainId });
        for (let i in addresses) {

            if (!ethers.utils.isAddress(addresses[i])) {
                console.log(`${errorMessage.ADDRESS_REQUIRED_OR_INVALID, addresses[i]}`);
                return res.status(400).send({ status: false, error: errorMessage.ADDRESS_REQUIRED_OR_INVALID });
            }
        }

        if (Number(data.expiry) < Date.now() / 1e3) {
            return res.status(400).send({ status: false, error: errorMessage.EXPIRY_INVALID });
        }

        if(!name){
            return res.status(400).send({ status: false, error: errorMessage.NAME_REQUIRED });
        }

        if(!version){
            return res.status(400).send({ status: false, error: errorMessage.VERSION_REQUIRED });
        }

        const domainData = { name: name, spotAddress: spotAddress, version: version };

        let id: string | null = validateSignature(data.maker, signature, data, chainId, domainData);

        if (!id) {
            console.log(errorMessage.SIGNATURE_NOT_VERIFIED);
            return res.status(400).send({ status: false, error: errorMessage.SIGNATURE_NOT_VERIFIED });
        }

        const isOrderPresent = await Order.findOne({ id: id, chainId: chainId }).lean();

        if (isOrderPresent) {
            return res.status(201).send({ status: true, message: "Order Already Created" });
        }
        
        let pair = await getPairId(data, chainId, spotAddress);
        if (!pair) {
            return res.status(400).send({ status: false, error: errorMessage.PAIR_ID_REQUIRED_OR_INVALID });
        }

        // if margin Order
        if (data.action != Action.LIMIT) {
            let response = await marginValidationAndUserPosition(signature, data, chainId, ipfs)

            if (response.status == false) {
                return res.status(response.statusCode).send({ status: false, error: response.error })
            }
        }

        if (data.action == Action.LIMIT) {
            let response = await validationAndUserPosition(data, chainId, ipfs);
            if (response.status == false) {
                return res.status(response.statusCode).send({ status: false, error: response.error })
            }
        }

        // geting exchangeRate decimal
        let priceDecimals: number | string = Number(getDecimals(pair.pairPrice));

        if (isNaN(priceDecimals) == true) {
            return res.status(400).send({ status: false, error: priceDecimals });
        }

        data.priceDecimals = priceDecimals;
        let cid = "";

        let orderCreate = {
            id: id,
            signature: signature,
            pair: pair.pair,
            token0: data.token0,
            token1: data.token1,
            maker: data.maker,
            token0Amount: data.token0Amount,
            leverage: data.leverage,
            token1Amount: data.token1Amount,
            nonce: data.nonce,
            price: data.price,
            pairPrice: pair.pairPrice,
            chainId: chainId,
            priceDecimals: priceDecimals,
            balanceAmount: data.balanceAmount,
            expiry: data.expiry,
            active: true,
            deleted: false,
            cid: cid,
            action: data.action,
            position: data.position,
            spot: spotAddress,
            name: name,
            version: version
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

        Order.create(orderCreate);

        // socket io data
        if (!ipfs) {
            socketService.emit(EVENT_NAME.PAIR_ORDER, {
                amount: data.balanceAmount,
                price: pair.pairPrice,
                action: data.action,
                position: data.position,
                pair: pair.pair
            });
        }

        console.log("Order Created ", "maker ", data.maker, "amount ", data.token0Amount.toString(), id, data?.action);

        return res.status(201).send({ status: true, message: "Order created successfully" });

    }
    catch (error: any) {

        if (error.isJoi == true) error.status = 422;
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return res.status(error.status).send({ status: false, error: error.message });
    }
}
