import { PairCreated, OrderCreated, UserPosition, OrderCreatedBackup } from "../db";
import { handleToken } from "../handlers/token";
import { getDecimals, validateSignature } from "../utils";
import Big from "big.js";
import { ethers } from "ethers";
import { createOrderSchema } from "../helper/validateRequest";
import { getMultiBalance, multicall } from "../sync/syncBalance";
import { mainIPFS } from "../IPFS/putFiles";
import { errorMessage } from "../helper/errorMessage";
import { ifOrderCreated, ifPairCreated, ifUserPosition, orderSignature } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";

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
    "buy": true,
    "salt": "12345",
    "exchangeRate": "18000000000000000000000"
    }
 * @param {*} req.body.chainId (string) numeric chainId
 * @param {*} req.body.ipfs (boolean) if it is present that means request is sent from backup 
 * @returns  error with message if any validation fail, if success return order created successfully
 */


async function handleOrderCreated(req: any, res: any) {
    try {

        let signature: string = req.body.signature;
        let data: orderSignature["value"] = req.body.data;
        let chainId: string = req.body.chainId;
        let ipfs: boolean = req.body.ipfs;

        let addresses = [data.maker, data.token0, data.token1];

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


        let id: string | null = validateSignature(data.maker, signature, data, chainId);

        if (!id) {
            console.log(errorMessage.signature);

            return res.status(400).send({ status: false, error: errorMessage.signature });
        }

        const isOrderPresent = await OrderCreated.findOne({ id: id, chainId: chainId }).lean();

        if (isOrderPresent) {
            return res.status(201).send({ status: true, message: "Order Already Created" });
        }

        let amount = Big(data.amount);

        if (data.buy == false) {

            const findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();

            let multicallData: number[] | null;
            let userToken0Balance = 0;
            let allowance = 0;

            if (!ipfs) {
                multicallData = await multicall(data.token0, data.maker, chainId)

                if (multicallData) {
                    userToken0Balance = multicallData[0];
                    allowance = multicallData[1];
                }
            }

            if (findUserPosition) {

                let _id = findUserPosition._id.toString();

                let currentInOrderBalance = Big(findUserPosition.inOrderBalance).plus(amount).toString();

                if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.allowance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken0Balance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.balance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }


                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            } else {

                if (!ipfs && Number(allowance) < Number(amount)) {
                    console.log(`${errorMessage.allowance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken0Balance) < Number(amount)) {
                    console.log(`${errorMessage.balance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }

                UserPosition.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        // balance: userToken0Balance,
                        id: data.maker
                    }
                );

            }
        }

        else if (data.buy == true) {

            let findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId });

            let multicallData: number[] | null
            let userToken1Balance = 0
            let allowance = 0

            if (!ipfs) {
                multicallData = await multicall(data.token1, data.maker, chainId)
                if (multicallData) {
                    userToken1Balance = multicallData[0];
                    allowance = multicallData[1];
                }
            }

            amount = Big(amount).times(data.exchangeRate).div(Big(10).pow(18));
            if (findUserPosition) {

                let _id = findUserPosition._id.toString();

                let currentInOrderBalance = Big(findUserPosition.inOrderBalance).plus(amount).toString();

                if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.allowance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken1Balance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.balance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }


                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            } else {

                if (!ipfs && Number(allowance) < Number(amount)) {
                    console.log(`${errorMessage.allowance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken1Balance) < Number(amount)) {
                    console.log(`${errorMessage.balance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }

                UserPosition.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        // balance: userToken1Balance,
                        id: data.maker
                    }
                );

            }

        }


        let isPairExist: ifPairCreated = await PairCreated.findOne({ token0: data.token0, token1: data.token1, chainId: chainId }).lean();
        let createPair: ifPairCreated | any;

        if (!isPairExist) {
            let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token0, data.token1]);
            let id = ethers.utils.keccak256(encoder);
            let token0 = await handleToken(data.token0, chainId);
            let token1 = await handleToken(data.token1, chainId);
            let temp = {
                id: id,
                exchangeRateDecimals: exchangeRateDecimals,
                minToken0Order: (10 ** 10).toString(),
                exchangeRate: '0',
                priceDiff: '0',
                token0: data.token0,
                token1: data.token1,
                chainId: chainId,
                symbol: `${token0}_${token1}`
            }
            createPair = await PairCreated.create(temp);

            console.log("Pair Created ", "T0 ", data.token0, "T1 ", data.token1, "CId ", chainId);

        }
        let pair: string;
        if (isPairExist) {
            pair = isPairExist.id?.toString();
        }
        else {
            pair = createPair.id.toString();
        }
        let cid;
        if (!ipfs) {
            cid = await mainIPFS([
                data,
                signature,
                chainId
            ],
                id
            );

            OrderCreatedBackup.create(
                {
                    id: id,
                    signature: signature,
                    pair: pair,
                    token0: data.token0,
                    token1: data.token1,
                    maker: data.maker,
                    amount: data.amount,
                    salt: data.salt,
                    exchangeRate: data.exchangeRate,
                    buy: data.buy,
                    chainId: chainId,
                    exchangeRateDecimals: exchangeRateDecimals,
                    balanceAmount: data.amount,
                    active: true,
                    deleted: false,
                    cid: cid
                }
            );
        }


        OrderCreated.create(

            {
                id: id,
                signature: signature,
                pair: pair,
                token0: data.token0,
                token1: data.token1,
                maker: data.maker,
                amount: data.amount,
                salt: data.salt,
                exchangeRate: data.exchangeRate,
                buy: data.buy,
                chainId: chainId,
                exchangeRateDecimals: exchangeRateDecimals,
                balanceAmount: data.amount,
                active: true,
                deleted: false,
                cid: cid
            }
        );



        // socket io data
        if (!ipfs) {
            socketService.emit(EVENT_NAME.PAIR_ORDER, {
                amount: data.amount,
                exchangeRate: data.exchangeRate,
                buy: data.buy,
                pair: pair
            });
        }

        console.log("Order Created ", "maker ", data.maker, "amount ", data.amount.toString(), id);

        return res.status(201).send({ status: true, message: "Order created successfully" });

    }
    catch (error: any) {

        if (error.isJoi == true) error.status = 422;
        console.log("Error @ handleOrderCreated", error);
        return res.status(error.status).send({ status: false, error: error.message });
    }
}


/**
 * @dev this api function will provide order as per the exchangeRate
 * @param {*} req.params.pairId (string) a valid pairId required
 * @param {*} req.query.exchangeRate (string) a valid pairId required
 * @param {*} req.query.buy (boolean) true for buying false for selling
 * @param {*} req.query.chainId (string) numeric chainId
 * @param {*} req.query.amount (string) numeric amount to be buy or sell in 10 to the pow 18 form
 * @param {*} res 
 * @returns 
 */
async function getLimitMatchedOrders(req: any, res: any) {

    try {

        let pairId: string = req.params.pairId;

        let exchangeRate: string = req.query.exchangeRate;

        let buy: string = req.query.buy;

        let amount: number = Number(req.query.amount);

        let chainId: string = req.query.chainId;


        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!exchangeRate || isNaN(Number(exchangeRate))) {
            return res.status(400).send({ status: false, error: errorMessage.exchangerate });
        }

        if (!buy || (buy != "true" && buy != "false")) {
            return res.status(400).send({ status: false, error: errorMessage.buy });
        }

        if (!amount || isNaN(amount) == true) {
            return res.status(400).send({ status: false, error: errorMessage.amount });
        }

        const isPairIdExist: ifPairCreated | null = await PairCreated.findOne({ id: pairId, chainId: chainId }).lean();

        if (!isPairIdExist) {
            return res.status(404).send({ status: false, error: errorMessage.pairId });
        }

        let getMatchedDoc: ifOrderCreated[] = [];

        if (buy == "true") {
            getMatchedDoc = await OrderCreated.aggregate(
                [
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                {"$expr" : {"$lte" : [{"$toDouble" :"$exchangeRate"} , Number(exchangeRate)]}},
                                { buy: false },
                                { chainId: chainId },
                                { deleted: false },
                                { active: true },
                                { cancelled: false }
                            ]
                        }
                    },
                    {
                        $sort: { exchangeRate: 1, balanceAmount: 1 }
                    }
                ],
                {
                    collation: {
                        locale: "en_US",
                        numericOrdering: true
                    }
                }
            );
        }
        else if (buy == "false") {
            getMatchedDoc = await OrderCreated.aggregate(
                [
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                {"$expr" : {"$gte" : [{"$toDouble" :"$exchangeRate"} , Number(exchangeRate)]}},
                                { buy: true },
                                { chainId: chainId },
                                { deleted: false },
                                { active: true },
                                { cancelled: false }
                            ]
                        }
                    },
                    {
                        $sort: { exchangeRate: -1, balanceAmount: 1 }
                    }
                ],
                {
                    collation: {
                        locale: "en_US",
                        numericOrdering: true
                    }
                }
            );
        }

        let data: ifOrderCreated[] = [];
        let currAmount = 0;
        let counter = 0;
        let addresses = [];
        let amounts = [];
        let ids = [];

        if (getMatchedDoc.length == 0) {
            return res.status(200).send({ status: true, data: [] });
        }

        for (let i = 0; i < getMatchedDoc.length; i++) {

            if (currAmount >= amount) {
                counter++;
                if (counter > 10) {
                    break;
                }
            }

            currAmount += Number(getMatchedDoc[i].balanceAmount);
            addresses.push(getMatchedDoc[i].maker);
            amounts.push(Number(getMatchedDoc[i].balanceAmount));
            data.push(getMatchedDoc[i]);
            ids.push(getMatchedDoc[i]._id);

        }

        let token;
        if (buy == "true") {
            token = data[0].token0;
        } else {
            token = data[0].token1;
        }

        let response = await getMultiBalance(token, addresses, ids, data, chainId, amounts);

        if (!response) {
            return res.status(200).send({ status: true, data: [] });
        }

        return res.status(200).send({ status: true, data: response });
    }
    catch (error: any) {
        console.log("Error @ getMatchedOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}


async function getMatchedMarketOrders(req: any, res: any) {
    try {

        let pairId: string = req.params.pairId;
        let buy: string = req.query.buy;
        let amount: number = Number(req.query.amount);
        let chainId: string = req.query.chainId;

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!buy || (buy != "false" && buy != "true")) {
            return res.status(400).send({ status: false, error: errorMessage.buy });
        }

        if (isNaN(amount) == true || amount <= 0) {
            return res.status(400).send({ status: false, error: errorMessage.amount });
        }

        let getMatchedDoc: ifOrderCreated[] = [];
        if (buy == "true") {
            getMatchedDoc = await OrderCreated.find({ pair: pairId, buy: false, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).collation({locale: "en_US", numericOrdering: true}).lean();
        }
        else if (buy == "false") {
            getMatchedDoc = await OrderCreated.find({ pair: pairId, buy: true, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).collation({locale: "en_US", numericOrdering: true}).lean();
        }

        let data: ifOrderCreated[] = [];
        let currAmount: number = 0;
        let counter: number = 0;
        let addresses: string[] = [];
        let amounts: number[] = [];
        let ids: string[] = [];

        for (let i = 0; i < getMatchedDoc?.length; i++) {

            if (currAmount >= amount) {
                counter++;
                if (counter > 5) {
                    break;
                }
            }
            if (buy == "true") {
                currAmount += Number(Big(getMatchedDoc[i].balanceAmount).times(getMatchedDoc[i].exchangeRate).div(Big(10).pow(18)));
            }
            else if (buy == "false") {
                currAmount += Number(getMatchedDoc[i].balanceAmount)
            }
            addresses.push(getMatchedDoc[i].maker);
            amounts.push(Number(getMatchedDoc[i].balanceAmount));
            data.push(getMatchedDoc[i]);
            ids.push(getMatchedDoc[i]._id);

        }

        if (getMatchedDoc.length == 0) {
            return res.status(200).send({ status: true, data: [] });
        }

        let token;
        if (buy == "true") {
            token = data[0].token0;
        } else {
            token = data[0].token1;
        }

        let result = await getMultiBalance(token, addresses, ids, data, chainId, amounts);

        if (!result) {
            return res.status(200).send({ status: true, data: [] });
        }
        return res.status(200).send({ status: true, data: result });
    }
    catch (error: any) {
        console.log("Error @ getMatchedMarketOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}



export { handleOrderCreated, getLimitMatchedOrders, getMatchedMarketOrders };


// if (buy == 'true') {
        //     getMatchedDoc = await OrderCreated.find({ pair: pairId, exchangeRate: { $lte: Number(exchangeRate) }, buy: false, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1, balanceAmount: 1 }).lean();
        // }
        // else if (buy == 'false') {
        //     getMatchedDoc = await OrderCreated.find({ pair: pairId, exchangeRate: { $gte: Number(exchangeRate) }, buy: true, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1, balanceAmount: 1 }).lean();
        // }