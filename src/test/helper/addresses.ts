
import fs from "fs";


export const Decimals = {
    token: 18,
    amount: 18
};




export function getTestConfig(name: any) {

    const Config = JSON.parse((fs.readFileSync( __dirname+ "/deployment/config.json")).toString());
    return Config[name]
}

export function getTestContractAddress(name: string) {
    let Deployments = JSON.parse((fs.readFileSync(__dirname + "/deployment/deployment.json")).toString());
    return Deployments["contracts"][name]["address"].toLowerCase()
}
