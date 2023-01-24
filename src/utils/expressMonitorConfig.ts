import { getVersion } from "../helper/chain";


require("dotenv").config()

let version = getVersion(process.env.NODE_ENV!);

export const expressMonitorConfig = {

    title: 'Express Status',  // Default title
    theme: 'default.css',     // Default styles
    path: '/status',
    socketPath: '/socket.io', // In case you use a custom path
    // websocket: existingSocketIoInstance,
    spans: [{
        interval: 1,            // Every second
        retention: 60           // Keep 60 datapoints in memory
    }, {
        interval: 5,            // Every 5 seconds
        retention: 60
    }, {
        interval: 15,           // Every 15 seconds
        retention: 60
    }],
    chartVisibility: {
        cpu: true,
        mem: true,
        load: true,
        eventLoop: true,
        heap: true,
        responseTime: true,
        rps: true,
        statusCodes: true
    },
    healthChecks: [
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: `/v/${version}/DB/status`,
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: `/v/${version}/DB/fetch/record`,
            headers: {},
        },

    ],
    // ignoreStartsWith: '/pair'
}