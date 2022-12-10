"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainIPFS = void 0;
const web3_storage_1 = require("web3.storage");
const process_1 = require("process");
const axios_1 = __importDefault(require("axios"));
require("dotenv").config();
const get = axios_1.default.get;
function makeStorageClient() {
    const token = process_1.env.WEB_3_TOKEN;
    return new web3_storage_1.Web3Storage({ token });
}
let errorCount = 0;
/**
 * @notice current we are not using this function
 * this function is used to get IPFS data i.e signature value etc and call create order function
 */
/*
async function getIPFSData() {
    try {
        const client = makeStorageClient();
        for await (const upload of client.list()) {
            console.log(upload.cid);
            // console.log(`${upload.name} - cid: ${upload.cid} - size: ${upload.dagSize}`)
            const res: any = await client.get(upload.cid);

            const files = await res.files();
            for (const file of files) {
                // console.log(` ${file.name} ${file.size}`);
                console.log(file.name);
                let data = await get(`https://${upload.cid}.ipfs.w3s.link/${file.name}`);
                data = data.data;
                let result = await axios({
                    method: "post",
                    url: "http://localhost:3030/create/order",
                    data: {
                        data: data[0],
                        signature: data[1],
                        chainId: data[2],
                        ipfs: true
                    }
                });

                console.log("IPFS Create Request", result.data);

            }

            if (!res.ok) {
                throw new Error(`failed to get ${upload.cid}`);
            }
        }
        console.log("IPFS End");
    }
    catch (error) {
        console.log("Error @ getIPFSData", error);
        if (errorCount < 5) {
            getIPFSData();
        }
        else {
            errorCount = 0;
        }
    }

}
*/
/**
 *
 * @param {*} data (object) e.g signature, value
 * @param {*} id (string) orderId (digest)
 * @returns cid
 */
function mainIPFS(data, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = process_1.env.WEB_3_TOKEN;
        const storage = new web3_storage_1.Web3Storage({ token });
        const buffer = Buffer.from(JSON.stringify(data));
        const files = [
            new web3_storage_1.File([buffer], `${id}.json`)
        ];
        const cid = yield storage.put(files);
        console.log("Content added with CID:", cid);
        return cid;
    });
}
exports.mainIPFS = mainIPFS;
// main([
//     {
//         maker: '0x103B62f68Da23f20055c572269be67fA7635f2fc',
//         token0: '0x5c16f2076a6c10DE6A7289E529143975f20850Fe',
//         token1: '0x1580a7C5BF1b687a096bB8Fa79491326a7f17359',
//         amount: '2000000000000000000',
//         buy: false,
//         salt: '1234567',
//         exchangeRate: '21000000000000000000000'
//     },
//     '0x0828113f10fd94d62b55e7983de434600671328a389ad794f577093f4a964cde667b463a4030d84d9ca028f26d64cba2549929ff23e3abaf29e9970263b8d0aa1c'
// ],
// '0x1f138359d57332d7ff4ec96046d4fc0c297439dd3b3812d0ee6d3ace2af9b091'
// )
