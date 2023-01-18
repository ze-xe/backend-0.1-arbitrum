
import fs from "fs";
var path = require("path");
var absolutePath = path.resolve("Relative file path");

// this file work as per contract directory

if (process.env.NODE_ENV == "test") {
    process.chdir('../')
}




export const Decimals = {
    token: 18,
    amount: 18
};


// export function getTestConfig(name: any) {
//     const Config = JSON.parse((fs.readFileSync(process.cwd() + "/src/test/helper/deployment/config.json")).toString());
//     return Config[name]
// }

export function getTestConfig(name: any) {

    const Config = JSON.parse((fs.readFileSync( __dirname+ "/deployment/config.json")).toString());
    return Config[name]
}

// console.log(getTestConfig("version"))

// export function getTestContractAddress(name: string) {
//     let Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/test/helper/deployment/deployment.json")).toString());
//     return Deployments["contracts"][name]["address"].toLowerCase()
// }

export function getTestContractAddress(name: string) {
    let Deployments = JSON.parse((fs.readFileSync(__dirname + "/deployment/deployment.json")).toString());
    return Deployments["contracts"][name]["address"].toLowerCase()
}
