import Big from "big.js";
import { OrderExecuted, PairCreated } from "../db";
import { errorMessage } from "../helper/errorMessage";
import { Interval } from "../helper/interface";












export async function _getBar(req: any, res: any) {

    try {

        let pairId: string = req.params.ticker;
        let interval: Interval = req.query.interval;
        let chainId: string = "421613";
        let from: number = Number(req.query.from) * 1000;
        // let from: number = 1671193631367;
        let to: number = Number(req.query.to) * 1000;
        let firstDataRequest = req.query.firstDataRequest;

        let intervalFromReq = ["5", "15", "30", "1H", "4H", "1D", "1W"]
        if (!intervalFromReq.includes(interval)) {
            return res.status(400).send({ status: false, error: errorMessage.interval })
        }
        if (isNaN(to) == true || to == 0) {
            to = Date.now();
        }

        let intervalMap = {
            "5": 300000,
            "15": 900000,
            "30": 1800000,
            "1H": 3600000,
            "4H": 14400000,
            "1D": 86400000,
            "1W": 604800000
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
        // let closeTimeStamp = from;
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
                        open: Big(close).div(Big(10).pow(18)).toString(),
                        high: Big(close).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(close).div(Big(10).pow(18)).toString(),
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
                    max = close
                    if (data[i].exchangeRate > close) {
                        max = data[i].exchangeRate
                    }
                    min = close;
                    if (data[i].exchangeRate < close) {
                        min = data[i].exchangeRate
                    }
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

export async function __getBar(req: any, res: any) {

    try {

        let pairId: string = req.params.ticker;
        let interval: Interval = req.query.interval;
        let chainId: string = "421613";
        let from: number = Number(req.query.from) * 1000;
        // let from: number = 1671193631367;
        let to: number = Number(req.query.to) * 1000;
        let firstDataRequest = req.query.firstDataRequest;
        console.log(firstDataRequest);
        let intervalFromReq = ["5", "15", "30", "1H", "4H", "1D", "1W"]
        if (!intervalFromReq.includes(interval)) {
            return res.status(400).send({ status: false, error: errorMessage.interval })
        }
        if (isNaN(to) == true || to == 0) {
            to = Date.now();
        }

        let intervalMap = {
            "5": 300000,
            "15": 900000,
            "30": 1800000,
            "1H": 3600000,
            "4H": 14400000,
            "1D": 86400000,
            "1W": 604800000
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
        let currTimestamp: number = data[0].blockTimestamp;

        // if (firstDataRequest == "false") {
        let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();

        if (lastOrder) {
            // console.log("inside false")
            min = lastOrder.exchangeRate;
            max = lastOrder.exchangeRate;
            open = lastOrder.exchangeRate;
            close = lastOrder.exchangeRate;
            currTimestamp = from;
        }
        // }

        // let closeTimeStamp = from;
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
                        open: Big(close).div(Big(10).pow(18)).toString(),
                        high: Big(close).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(close).div(Big(10).pow(18)).toString(),
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
                    if (data[i].exchangeRate > close) {
                        max = data[i].exchangeRate
                    }
                    min = close;
                    if (data[i].exchangeRate < close) {
                        min = data[i].exchangeRate
                    }
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

export async function ___getBar(req: any, res: any) {

    try {

        let pairId: string = req.params.ticker;
        let interval: Interval = req.query.interval;
        let chainId: string = "421613";
        let from: number = Number(req.query.from) * 1000;
        let to: number = Number(req.query.to) * 1000;
        let firstDataRequest = req.query.firstDataRequest;
        console.log(firstDataRequest);
        let intervalFromReq = ["5", "15", "30", "1H", "4H", "1D", "1W"]
        if (!intervalFromReq.includes(interval)) {
            return res.status(400).send({ status: false, error: errorMessage.interval })
        }
        if (isNaN(to) == true || to == 0) {
            to = Date.now();
        }

        let intervalMap = {
            "5": 300000,
            "15": 900000,
            "30": 1800000,
            "1H": 3600000,
            "4H": 14400000,
            "1D": 86400000,
            "1W": 604800000
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


            let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();
            let exchangeRatesTrend = [];

            if (!lastOrder) {
                return res.status(200).send({ status: true, data: [] });
            }
            let min = lastOrder.exchangeRate;
            let max = lastOrder.exchangeRate;
            let open = lastOrder.exchangeRate;
            let close = lastOrder.exchangeRate;
            let currTimestamp = from;

            while (currTimestamp < to) {
                let temp = {
                    time: currTimestamp,
                    open: Big(open).div(Big(10).pow(18)).toString(),
                    high: Big(max).div(Big(10).pow(18)).toString(),
                    close: Big(close).div(Big(10).pow(18)).toString(),
                    low: Big(min).div(Big(10).pow(18)).toString(),
                    volume: '0'
                };
                exchangeRatesTrend.push(temp);
                currTimestamp = currTimestamp + intervalInMSec;
            }

            let result = {
                exchangeRate: exchangeRatesTrend,
            };
            return res.status(200).send({ status: true, data: result });


        }

        let exchangeRatesTrend = [];
        let min: string = Big(Number.MAX_VALUE).toString();
        let max: string = Big(0).toString();
        let open: string = data[0].exchangeRate;
        let close: string = data[0].exchangeRate;
        let currTimestamp: number = data[0].blockTimestamp;

        // if (firstDataRequest == "false") {
        let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();

        // if (!lastOrder) {
        //     return res.status(200).send({ status: true, data: [] });
        // }

        if (lastOrder) {
            // console.log("inside false")
            min = lastOrder.exchangeRate;
            max = lastOrder.exchangeRate;
            open = lastOrder.exchangeRate;
            close = lastOrder.exchangeRate;
            currTimestamp = from;
        }
        // }

        // let closeTimeStamp = from;
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

                if (firstDataRequest == 'true' && i == data.length - 1) {

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

                if (firstDataRequest == 'false' && i == data.length - 1 && currTimestamp >= to) {

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
                else if (firstDataRequest == 'false' && i == data.length - 1 && currTimestamp < to) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: Big(volume).div(Big(10).pow(18)).toString()
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
                        open: Big(close).div(Big(10).pow(18)).toString(),
                        high: Big(close).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(close).div(Big(10).pow(18)).toString(),
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
                    if (Number(data[i].exchangeRate) > Number(close)) {
                        max = data[i].exchangeRate
                    }
                    min = close;
                    if (Number(data[i].exchangeRate) < Number(close)) {
                        min = data[i].exchangeRate
                    }
                    open = close;
                    close = data[i].exchangeRate;
                    // currTimestamp = currTimestamp + interval;
                    volume = data[i].fillAmount;
                }

                if (firstDataRequest == 'true' && i == data.length - 1) {

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

                if (firstDataRequest == 'false' && i == data.length - 1 && currTimestamp >= to) {

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
                else if (firstDataRequest == 'false' && i == data.length - 1 && currTimestamp < to) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: Big(volume).div(Big(10).pow(18)).toString()
                    };
                    exchangeRatesTrend.push(temp);
                    min = close;
                    max = close;
                    open = close;
                    close = close;
                    currTimestamp = currTimestamp + intervalInMSec;
                    volume = '0'
                    i--;
                    // currTimestamp = currTimestamp + intervalInMSec

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

export async function getBar(req: any, res: any) {

    try {

        let pairId: string = req.params.ticker;
        let interval: Interval = req.query.interval;
        let chainId: string = "421613";
        let from: number = Number(req.query.from) * 1000;
        let to: number = Number(req.query.to) * 1000;
        let firstDataRequest = req.query.firstDataRequest;
        console.log(firstDataRequest);
        let intervalFromReq = ["5", "15", "30", "1H", "4H", "1D", "1W"]
        if (!intervalFromReq.includes(interval)) {
            return res.status(400).send({ status: false, error: errorMessage.interval })
        }
        if (isNaN(to) == true || to == 0) {
            to = Date.now();
        }

        let intervalMap = {
            "5": 300000,
            "15": 900000,
            "30": 1800000,
            "1H": 3600000,
            "4H": 14400000,
            "1D": 86400000,
            "1W": 604800000
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


            let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();
            let exchangeRatesTrend = [];

            if (!lastOrder) {
                return res.status(200).send({ status: true, data: [] });
            }
            let min = lastOrder.exchangeRate;
            let max = lastOrder.exchangeRate;
            let open = lastOrder.exchangeRate;
            let close = lastOrder.exchangeRate;
            let currTimestamp = from;

            while (currTimestamp < to) {
                let temp = {
                    time: currTimestamp,
                    open: Big(open).div(Big(10).pow(18)).toString(),
                    high: Big(max).div(Big(10).pow(18)).toString(),
                    close: Big(close).div(Big(10).pow(18)).toString(),
                    low: Big(min).div(Big(10).pow(18)).toString(),
                    volume: '0'
                };
                exchangeRatesTrend.push(temp);
                currTimestamp = currTimestamp + intervalInMSec;
            }

            let result = {
                exchangeRate: exchangeRatesTrend,
            };
            return res.status(200).send({ status: true, data: result });


        }

        let exchangeRatesTrend = [];
        let min: string = Big(Number.MAX_VALUE).toString();
        let max: string = Big(0).toString();
        let open: string = data[0].exchangeRate;
        let close: string = data[0].exchangeRate;
        let currTimestamp: number = data[0].blockTimestamp;

        // if (firstDataRequest == "false") {
        let lastOrder = await OrderExecuted.findOne({ pair: pairId, chainId: chainId, blockTimestamp: { $lt: Number(from) } }).sort({ createdAt: -1 }).lean();

        // if (!lastOrder) {
        //     return res.status(200).send({ status: true, data: [] });
        // }

        if (lastOrder) {
            // console.log("inside false")
            min = lastOrder.exchangeRate;
            max = lastOrder.exchangeRate;
            open = lastOrder.exchangeRate;
            close = lastOrder.exchangeRate;
            currTimestamp = from;
        }
        // }

        // let closeTimeStamp = from;
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

                

                if ( i == data.length - 1 && currTimestamp >= to) {

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
                else if (i == data.length - 1 && currTimestamp < to) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: Big(volume).div(Big(10).pow(18)).toString()
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
                        open: Big(close).div(Big(10).pow(18)).toString(),
                        high: Big(close).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(close).div(Big(10).pow(18)).toString(),
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
                    if (Number(data[i].exchangeRate) > Number(close)) {
                        max = data[i].exchangeRate
                    }
                    min = close;
                    if (Number(data[i].exchangeRate) < Number(close)) {
                        min = data[i].exchangeRate
                    }
                    open = close;
                    close = data[i].exchangeRate;
                    // currTimestamp = currTimestamp + interval;
                    volume = data[i].fillAmount;
                }

                

                if ( i == data.length - 1 && currTimestamp >= to) {

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
                else if (i == data.length - 1 && currTimestamp < to) {

                    let temp = {
                        time: currTimestamp,
                        open: Big(open).div(Big(10).pow(18)).toString(),
                        high: Big(max).div(Big(10).pow(18)).toString(),
                        close: Big(close).div(Big(10).pow(18)).toString(),
                        low: Big(min).div(Big(10).pow(18)).toString(),
                        volume: Big(volume).div(Big(10).pow(18)).toString()
                    };
                    exchangeRatesTrend.push(temp);
                    min = close;
                    max = close;
                    open = close;
                    close = close;
                    currTimestamp = currTimestamp + intervalInMSec;
                    volume = '0'
                    i--;
                    // currTimestamp = currTimestamp + intervalInMSec

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




export async function getSymbol(req: any, res: any) {
    try {

        let symbol = req.query.symbol;

        let symbolDetails = await PairCreated.findOne({ symbol: symbol }).lean();

        if (!symbolDetails) {
            return res.status(404).send({ status: false, data: errorMessage.symbol })
        }

        let data = {
            symbol: symbolDetails.symbol,
            ticker: symbolDetails.id
        }

        return res.status(200).send({ status: true, data: data })
    }
    catch (error: any) {
        console.log("Error @ getSymbol", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}