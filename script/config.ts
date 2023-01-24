import axios from 'axios';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
// import { version } from '../src/helper/constant';

require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

const CONFIG = (file: string, env: string | undefined, network: string | undefined) => `https://raw.githubusercontent.com/ze-xe/contracts-0.1/${env}/deployments/${network}/${file}.json`;
// const _version = version.split(".");
async function main() {
    
    const deployments = await axios.get(CONFIG('deployments', process.env.NODE_ENV, process.env.NETWORK));
    const config = await axios.get(CONFIG('config', process.env.NODE_ENV, process.env.NETWORK));
    // write to ./deployments.json
     fs.writeFileSync(process.cwd() + '/src/deployments/deployments.json', JSON.stringify(deployments.data, null, 2));
     fs.writeFileSync(process.cwd() + '/src/deployments/config.json', JSON.stringify(config.data, null, 2));
    
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
})
// .then(async()=>{
//     const Config = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/config.json")).toString());
//     const currentVersion = Config["version"].split(".");
//     if(_version[0] != currentVersion[0] || _version[1] != currentVersion[1]){
//         // await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();
//         // await mongoose.createConnection(process.env.MONGO_URL1! as string).dropDatabase();
//         console.log("data base deleted")
//     }
// });
