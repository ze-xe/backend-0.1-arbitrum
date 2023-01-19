import express from "express";
import { connect, backupConnection } from "./src/DB/db";
import cors from "cors";
const app = express();
import orderRoute from "./src/routes/orderRoute";
import pairRoutes from "./src/routes/pairRoutes";
import userRoute from "./src/routes/userRoute";
import chartRoute from "./src/routes/chartRoute"
import DBRoute from "./src/routes/DBRoute"
import helmet from "helmet";
import { start } from "./src/utils/appUtil";
import { createServer } from "http";
export const httpServer = createServer(app);
import morgan from 'morgan';
import { expressMonitorConfig } from "./src/utils/utils";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { getVersion } from "./src/helper/chain";

export const sentry = Sentry

Sentry.init({
    // @ts-ignore
    dsn: "https://7d303c69af974f47aeb870a4537472ee@o4504400337698816.ingest.sentry.io/4504405098823680",
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    enabled: process.env.NODE_ENV == "production"
});


app.use(Sentry.Handlers.requestHandler());

app.use(Sentry.Handlers.tracingHandler());

app.use(require('express-status-monitor')(
    expressMonitorConfig
));

// require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });
require("dotenv").config()

app.use(morgan('dev'));

connect();
app.use(cors({
    origin: '*'
}));
app.use(helmet());
app.use(express.json());

let version = getVersion(process.env.NODE_ENV!)
app.use(`/v/${version}/pair`, pairRoutes);
app.use(`/v/${version}/user`, userRoute);
app.use(`/v/${version}/chart`, chartRoute)
app.use(DBRoute)
app.use(orderRoute);


app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});


export async function run() {
    try {
        if (process.env.NODE_ENV == "test") {
            await start("31337")
        } else {
            await start("421613")
        }
    }
    catch (error) {
        console.log("Error @ run", error);
    }
}


// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err: any, req: any, res: any, next: any) {
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});

httpServer.listen(3010, function () {
    console.log("app running on port " + (3010));
});



// set NODE_ENV=test && mocha -r ts-node/register --timeout 180000 ./src/test/api/BmarginOrderLong.ts