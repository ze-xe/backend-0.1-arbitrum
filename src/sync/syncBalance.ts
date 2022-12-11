import { BigNumber, ethers } from "ethers";
import { UserPosition, OrderCreated } from "../db";
import Big from "big.js";
import { getERC20ABI, getRpcLink, getProvider, getInterface, MulticallAbi, getExchangeAddress } from "../utils";
import { MulticallAddress } from "../helper/constant";
import { ifOrderCreated, ifUserPosition, orderSignature } from "../helper/interface";

/**
 * @dev this function is use to get onchain data for create order api, i.e balance and allowance
 * @param {*} token (string) address of token 
 * @param {*} maker (string) address of maker
 * @param {*} chainId (string) numeric chainId
 * @returns ([number])) [balance, allowance]
 */
async function multicall(token: string, maker: string, chainId: string): Promise<number[] | null> {
    try {

        const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);

        const multicall = new ethers.Contract(
            MulticallAddress[`${chainId}`],
            MulticallAbi,
            provider
        );

        const itf: ethers.utils.Interface = getInterface(getERC20ABI());
        const input: string[][] = [[token, itf.encodeFunctionData("balanceOf", [maker])], [token, itf.encodeFunctionData("allowance", [maker, getExchangeAddress(chainId)])]]
        let resp = await multicall.callStatic.aggregate(
            input
        );

        let outPut: number[] = [];

        for (let i in resp[1]) {
            outPut.push(Number(BigNumber.from(resp[1][i]).toString()))
        }

        return outPut

    }
    catch (error) {
        console.log(`Error @ Multicall`, error)
        return null
    }
}

/**
 * @dev this function is used to check weather the fetched order is still active or not
 * @notice its check if maker has sufficeint token or not, and remove invalid data, update as inActive in DB
 * @param {*} token (string) address of token
 * @param {*} addresses ([string]) addresses of user
 * @param {*} ids ([string]) ids of orders
 * @param {*} data (object) document from DB
 * @param {*} chainId (string) numeric chainId
 * @param {*} amounts ([string]) numeric amounts of repective orders
 * @returns (object) only valid order send 
 */
async function getMultiBalance(token: string, addresses: string[], ids: string[], data: ifOrderCreated[], chainId: string, amounts: number[]) {

    const _getMultiBalance = async () => {
        try {
            const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);

            const multicall: ethers.Contract = new ethers.Contract(
                MulticallAddress[`${chainId}`],
                MulticallAbi,
                provider
            );


            const itf: ethers.utils.Interface = getInterface(getERC20ABI());


            const resp: any = await multicall.callStatic.aggregate(

                addresses.map((add: string) => {
                    return [
                        token,
                        itf.encodeFunctionData("balanceOf", [add]),
                    ];
                })

            );

            let inActiveIds: string[] = [];
            for (let i = 0; i < resp[1].length; i++) {

                let balance = BigNumber.from(resp[1][i]).toString();
                let userPosition: ifUserPosition = await UserPosition.findOne({ token: token, id: addresses[i], chainId: chainId }).lean();
                let inOrderBalance = Big(userPosition.inOrderBalance);

                if (Number(balance) < Number(inOrderBalance)) {
                    inActiveIds.push(ids[i]);
                    let currentInOrderBalance = Big(inOrderBalance).minus(amounts[i]).toString();

                    let updateUserPosition = UserPosition.findOneAndUpdate({ token: token, id: addresses[i], chainId: chainId }, { $set: { inOrderBalance: currentInOrderBalance } });

                    let deleteOrder = OrderCreated.findOneAndUpdate({ _id: ids[i] }, { $set: { active: false } });
                    await Promise.all([updateUserPosition, deleteOrder]);
                }

            }

            let res: orderSignature[] = [];

            for (let i in data) {

                if (inActiveIds.includes(data[i]._id)) {
                    continue;
                }
                else {
                    res.push({
                        signature: data[i].signature,
                        value: {
                            maker: data[i].maker,
                            token0: data[i].token0,
                            token1: data[i].token1,
                            amount: data[i].amount,
                            buy: data[i].buy,
                            salt: data[i].salt,
                            exchangeRate: data[i].exchangeRate,
                        }
                    });
                }
            }

            return res;
        } catch (error) {
            console.log("Error @ Multicall", error);
            return null

        }
    };
    return _getMultiBalance();
}



/**
 * @dev this function will run periodically e.g 30 min etc, it will check all the orders, for there maker balance and order amount, if order is active = false and now the user have sufficient balance then it will change its status to true, if order is active but now user does not have sufficient token then it will change its status to false 
 * @param {*} chainId (string) numeric chainId
 */
async function orderStatus(chainId: string) {
    try {

        const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);

        const multicall: ethers.Contract = new ethers.Contract(
            MulticallAddress[`${chainId}`],
            MulticallAbi,
            provider
        );


        const itf: ethers.utils.Interface = getInterface(getERC20ABI());
        let hasOrder: boolean = true;
        let page: number = 0;
        const _limit = 20;

        while (hasOrder == true) {
            const getOrderCreated: ifOrderCreated[] = await OrderCreated.find({ deleted: false, cancelled: false, chainId: chainId }).skip(page * _limit).limit(_limit).lean();
            if (getOrderCreated.length == 0) {
                hasOrder = false;
                break;
            }
            page++;

            let input: any = [];

            // creating input for multicall
            for (let k in getOrderCreated) {

                if (getOrderCreated[k].buy == false) {

                    input.push([getOrderCreated[k].token0, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);

                }
                else if (getOrderCreated[k].buy == true) {

                    input.push([getOrderCreated[k].token1, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);
                }

            }

            let resp: any = await multicall.callStatic.aggregate(input);

            for (let i = 0; i < resp[1].length; i++) {

                let balance: string = BigNumber.from(resp[1][i]).toString();

                let token: string;
                let amount: Big;
                let id = getOrderCreated[i].maker;

                if (getOrderCreated[i].buy == false) {
                    token = getOrderCreated[i].token0;
                    amount = Big(getOrderCreated[i].balanceAmount);
                }
                else {
                    token = getOrderCreated[i].token1;
                    amount = Big(getOrderCreated[i].balanceAmount).times(getOrderCreated[i].exchangeRate).div(Big(10).pow(18));
                }

                if (getOrderCreated[i].active == true) {

                    const getUserPos: ifUserPosition = await UserPosition.findOne({ token: token, id: id, chainId: chainId }).lean();

                    let inOrderBalance = Big(getUserPos.inOrderBalance);


                    if (Number(inOrderBalance) > Number(balance)) {
                        let currentInOrderBalance = Big(inOrderBalance).minus(amount).toString();
                        // updating inOrderBalance and active
                        await Promise.all([OrderCreated.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: false } }),
                        UserPosition.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: currentInOrderBalance } })]);
                        console.log("inactive", getOrderCreated[i].id, getUserPos.id);

                    }
                }
                else if (getOrderCreated[i].active == false) {

                    const getUserPos: ifUserPosition = await UserPosition.findOne({ token: token, id: getOrderCreated[i].maker, chainId: getOrderCreated[i].chainId }).lean();

                    let inOrderBalance = Big(getUserPos.inOrderBalance).plus(amount).toString();

                    if (Number(inOrderBalance) < Number(balance)) {

                        await Promise.all([OrderCreated.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: true } }),
                        UserPosition.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: inOrderBalance } })]);
                        console.log("active", getOrderCreated[i].id, getUserPos.id);
                    }
                }
            }

        }

    }
    catch (error) {
        console.log("Error @ orderStatus", error);
    }
}

function startOrderStatus(chainId: string) {
    setInterval(async () => {
        console.log("order status start running");
        await orderStatus(chainId);
        console.log("order status done updating");
    }, 1000 * 60 * 30);
}




export { getMultiBalance, multicall, startOrderStatus };
// getMultiBalance("0x6CeEBBFF9FaA802990f58659c1Ff227B4534570C", ["0xCf1709Ad76A79d5a60210F23e81cE2460542A836", "0x6983D1E6DEf3690C4d616b13597A09e6193EA013"], "1666600000")
// .then((resp) => {
//     // console.log(BigNumber.from(resp[1][0]).toString())
//     console.log(resp)
// })

