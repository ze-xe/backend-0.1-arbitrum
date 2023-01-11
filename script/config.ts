import axios from 'axios';
import fs from 'fs';
import path from 'path';

require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });
const CONFIG = (file: string, env: string | undefined, network: string | undefined) => `https://raw.githubusercontent.com/ze-xe/contracts-0.1/${env}/deployments/${network}/${file}.json`;

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
});
