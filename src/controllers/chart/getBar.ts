import Big from "big.js";
import * as sentry from "@sentry/node";
import { OrderExecuted, Pair } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { Interval } from "../../helper/interface";



export async function getBar(req: any, res: any) {

    try {

        let pairId: string = req.params.ticker?.toLowerCase();
        let interval: Interval = req.query.interval;
        let chainId: string = "421613";
        let from: number = Number(req.query.from) * 1000;
        let to: number = Number(req.query.to) * 1000;
        let firstDataRequest = req.query.firstDataRequest;
        // console.log(interval);

        if (firstDataRequest) {
            console.log("from", from)
            console.log("to", to)
        }
        let intervalFromReq = ["5", "15", "30", "60", "240", "1D", "1W"]

        if (!intervalFromReq.includes(interval)) {
            return res.status(400).send({ status: false, error: errorMessage.INTERVAL_INVALID })
        }

        let intervalMap = {
            "5": 300000,
            "15": 900000,
            "30": 1800000,
            "60": 3600000,
            "240": 14400000,
            "1D": 86400000,
            "1W": 604800000
        };

        let intervalInMSec: number = intervalMap[`${interval}`]

        if (isNaN(to) == true || to == 0) {
            to = Date.now();
        }

        // if(to > Date.now()){
        //     to = Date.now()
        // }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.TICKER_NOT_FOUND });
        }
        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.CHAIN_ID_REQUIRED });
        }

        let data = await OrderExecuted.find({ pair: pairId, chainId: chainId, blockTimestamp: { $gte: Number(from), $lte: Number(to) } }).sort({ blockTimestamp: 1, createdAt: 1 }).lean();

        if (data.length == 0) {

            let isPairExist = await Pair.findOne({ id: pairId, chainId, active: true }).lean();

            if (!isPairExist) {
                return res.status(404).send({ status: false, error: errorMessage.PAIR_ID_REQUIRED_OR_INVALID });
            }

            let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();
            let exchangeRatesTrend: any = [];

            if (!lastOrder) {
                return res.status(200).send({ status: true, data: [] });
            }
            let min = lastOrder.pairPrice;
            let max = lastOrder.pairPrice;
            let open = lastOrder.pairPrice;
            let close = lastOrder.pairPrice;
            let currTimestamp = from;

            while (currTimestamp < to) {
                let temp = {
                    time: currTimestamp,
                    open: Big(open).div(1e18).toString(),
                    high: Big(max).div(1e18).toString(),
                    close: Big(close).div(1e18).toString(),
                    low: Big(min).div(1e18).toString(),
                    volume: '0'
                };
                exchangeRatesTrend.push(temp);
                currTimestamp = currTimestamp + intervalInMSec;
                if (currTimestamp > to) {
                    break
                }
            }

            let result = {
                price: exchangeRatesTrend,
            };
            return res.status(200).send({ status: true, data: result });

        }

        let exchangeRatesTrend: any = [];
        let min: string = Big(Number.MAX_VALUE).toString();
        let max: string = Big(0).toString();
        let open: string = data[0].pairPrice;
        let close: string = data[0].pairPrice;
        let currTimestamp: number = data[0].blockTimestamp;

        let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();

        if (lastOrder) {
            min = lastOrder.pairPrice;
            max = lastOrder.pairPrice;
            open = lastOrder.pairPrice;
            close = lastOrder.pairPrice;
            currTimestamp = from;
        }

        let volume: string | number = 0;

        for (let i = 0; i < data.length; i++) {

            if (data[i].blockTimestamp <= currTimestamp + intervalInMSec) {
                // this block will mainly update the min max, open close value

                if (Number(data[i].pairPrice) > Number(max)) {
                    max = data[i].pairPrice;
                }

                if (Number(data[i].pairPrice) < Number(min)) {
                    min = data[i].pairPrice;
                }

                close = data[i].pairPrice;
                volume = Big(volume).plus(data[i].pairToken0Amount).toString();

                if (i == data.length - 1 && currTimestamp >= to) {

                    if (currTimestamp > to) {
                        break;
                    }
                    else {
                        let temp = {
                            time: currTimestamp,
                            open: Big(open).div(1e18).toString(),
                            high: Big(max).div(1e18).toString(),
                            close: Big(close).div(1e18).toString(),
                            low: Big(min).div(1e18).toString(),
                            volume: Big(volume).div(1e18).toString()
                        };
                        exchangeRatesTrend.push(temp);
                    }

                }
                else if (i == data.length - 1 && currTimestamp < to) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(1e18).toString(),
                        high: Big(max).div(1e18).toString(),
                        close: Big(close).div(1e18).toString(),
                        low: Big(min).div(1e18).toString(),
                        volume: Big(volume).div(1e18).toString()
                    };
                    exchangeRatesTrend.push(temp);
                    min = close;
                    max = close;
                    open = close;
                    close = close;
                    currTimestamp = currTimestamp + intervalInMSec;
                    data[i].pairToken0Amount = '0';
                    volume = '0';
                    i--;
                }
            }
            else {

                //if value exceed it will  genrate object regarding upper if block
                let temp = {
                    time: currTimestamp,
                    open: Big(open).div(1e18).toString(),
                    high: Big(max).div(1e18).toString(),
                    close: Big(close).div(1e18).toString(),
                    low: Big(min).div(1e18).toString(),
                    volume: Big(volume).div(1e18).toString()

                };
                exchangeRatesTrend.push(temp);

                currTimestamp = currTimestamp + intervalInMSec;
                // checking next block lays in next interval
                if (data[i].blockTimestamp > currTimestamp + intervalInMSec) {
                    let temp = {
                        time: currTimestamp,
                        open: Big(close).div(1e18).toString(),
                        high: Big(close).div(1e18).toString(),
                        close: Big(close).div(1e18).toString(),
                        low: Big(close).div(1e18).toString(),
                        volume: '0'
                    };
                    exchangeRatesTrend.push(temp);
                    min = close;
                    max = close;
                    open = close;
                    close = close;
                    currTimestamp = currTimestamp + intervalInMSec;
                    volume = '0';
                    i--;     // as this block is not fall hence we increase the interval and call same block 
                }
                else {
                    // block fall in that interval
                    max = close
                    if (Number(data[i].pairPrice) > Number(close)) {
                        max = data[i].pairPrice
                    }
                    min = close;
                    if (Number(data[i].pairPrice) < Number(close)) {
                        min = data[i].pairPrice
                    }
                    open = close;
                    close = data[i].pairPrice;
                    volume = data[i].pairToken0Amount;
                }

                if (i == data.length - 1 && currTimestamp >= to) {

                    if (currTimestamp > to) {
                        break;
                    }
                    else {
                        let temp = {
                            time: currTimestamp,
                            open: Big(open).div(1e18).toString(),
                            high: Big(max).div(1e18).toString(),
                            close: Big(close).div(1e18).toString(),
                            low: Big(min).div(1e18).toString(),
                            volume: Big(volume).div(1e18).toString()
                        };
                        exchangeRatesTrend.push(temp);
                    }

                }
                else if (i == data.length - 1 && currTimestamp < to) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(1e18).toString(),
                        high: Big(max).div(1e18).toString(),
                        close: Big(close).div(1e18).toString(),
                        low: Big(min).div(1e18).toString(),
                        volume: Big(volume).div(1e18).toString()
                    };
                    exchangeRatesTrend.push(temp);
                    min = close;
                    max = close;
                    open = close;
                    close = close;
                    currTimestamp = currTimestamp + intervalInMSec;
                    volume = '0'
                    i--;

                }

            }
        }

        let result = {
            exchangeRate: exchangeRatesTrend,
        };
        return res.status(200).send({ status: true, data: result });
    }

    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getBar", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}