import Big from "big.js";
import { OrderExecuted, PairCreated } from "../db";
import { errorMessage } from "../helper/errorMessage";
import { Interval } from "../helper/interface";












export async function getBar(req: any, res: any) {

    try {

        let pairId: string = req.params.ticker;
        let interval: Interval = req.query.interval;
        let chainId: string = "421613";
        let from: number = Number(req.query.from)*1000;
        let to: number = Number(req.query.to)*1000;

        let intervalFromReq = ["5m", "15m", "30m", "1h", "4h", "1d", "1w"]
        if (!intervalFromReq.includes(interval)) {
            return res.status(400).send({ status: false, error: errorMessage.interval })
        }
        if(isNaN(to) == true || to == 0){
            to = Date.now();
        }

        let intervalMap = {
            "5m": 300000,
            "15m": 900000,
            "30m": 1800000,
            "1h": 3600000,
            "4h": 14400000,
            "1d": 86400000,
            "1w": 604800000
        };

       let intervalInMSec: number = intervalMap[`${interval}`]

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.ticker });
        }
        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        let data = await OrderExecuted.find({ pair: pairId, chainId: chainId, blockTimestamp: { $gte: Number(from), $lte: Number(to) } }).sort({ blockTimestamp: 1, createdAt: 1 }).lean();
        
        if (data.length == 0) {

            let isPairExist = await PairCreated.findOne({ id: pairId, chainId }).lean();

            if (!isPairExist) {
                return res.status(404).send({ status: false, error: errorMessage.pairId });
            }
            return res.status(200).send({ status: true, data: [] });
        }

        let exchangeRatesTrend = [];

        let min: string = Big(Number.MAX_VALUE).toString();
        let max: string = Big(0).toString();
        let open: string = data[0].exchangeRate;
        let close: string = data[0].exchangeRate;
        let currTimestamp = data[0].blockTimestamp;
        let closeTimeStamp = data[0].blockTimestamp;
        let volume: string | number = 0;

        for (let i = 0; i < data.length; i++) {



            if (data[i].blockTimestamp <= currTimestamp + intervalInMSec) {
                // this block will mainly update the min max, open close value

                if (Number(data[i].exchangeRate) > Number(max)) {
                    max = data[i].exchangeRate;
                }

                if (Number(data[i].exchangeRate) < Number(min)) {
                    min = data[i].exchangeRate;
                }

                close = data[i].exchangeRate;
                volume = Big(volume).plus(data[i].fillAmount).toString();

                if (i == data.length - 1) {

                    let temp = {
                        time: currTimestamp / 1000,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: Big(volume).div(Big(10).pow(18)).toString()
                    };
                    exchangeRatesTrend.push(temp);

                }
            }
            else {

                //if value exceed it will  genrate object regarding upper if block
                let temp = {
                    time: currTimestamp,
                    open: Big(open).div(Big(10).pow(18)).toString(),
                    high: Big(max).div(Big(10).pow(18)).toString(),
                    close: Big(close).div(Big(10).pow(18)).toString(),
                    low: Big(min).div(Big(10).pow(18)).toString(),
                    volume: Big(volume).div(Big(10).pow(18)).toString()

                };
                exchangeRatesTrend.push(temp);

                currTimestamp = currTimestamp + intervalInMSec;
                // checking next block lays in next interval
                if (data[i].blockTimestamp > currTimestamp + intervalInMSec) {
                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: '0'
                    };
                    exchangeRatesTrend.push(temp);
                    min = close;
                    max = close;
                    open = close;
                    close = close;
                    currTimestamp = currTimestamp + intervalInMSec;
                    volume = '0';
                    i--;
                }
                else {
                    // block fall in that interval
                    min = data[i].exchangeRate;
                    max = data[i].exchangeRate;
                    open = close;
                    close = data[i].exchangeRate;
                    // currTimestamp = currTimestamp + interval;
                    volume = data[i].fillAmount;
                }

                if (i == data.length - 1) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: Big(volume).div(Big(10).pow(18)).toString()
                    };
                    exchangeRatesTrend.push(temp);

                }

            }
        }

        let result = {
            exchangeRate: exchangeRatesTrend,
        };
        return res.status(200).send({ status: true, data: result });
    }

    catch (error: any) {
        console.log("Error @ getBar", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}



export async function getSymbol(req: any, res: any){
    try{

        let symbol = req.query.symbol;

        let symbolDetails = await PairCreated.findOne({symbol: symbol}).lean();

        if(!symbolDetails){
            return res.status(404).send({status: false, data: errorMessage.symbol})
        }

        let data = {
            symbol: symbolDetails.symbol,
            ticker: symbolDetails.id
        }

        return res.status(200).send({status: true, data: data})
    }
    catch (error: any) {
        console.log("Error @ getSymbol", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}