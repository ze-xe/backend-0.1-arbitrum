import express from "express";
import { connect, backupConnection } from "./src/db";
import cors from "cors";
const app = express();
import orderRoute from "./src/routes/orderRoute";
import pairRoutes from "./src/routes/pairRoutes";
import userRoute from "./src/routes/userRoute";
import chartRoute from "./src/routes/chartRoute"
import helmet from "helmet";
import { start } from "./src/appUtil";
import { socketService } from "./src/socketIo/socket.io";
import { createServer } from "http";
export const httpServer = createServer(app);

require("dotenv").config();


backupConnection;
connect();
app.use(cors(
    {
        origin: ["https://zexe.io", "http://localhost:3000"]
    }
));
app.use(helmet());
app.use(express.json());
app.use("/pair", pairRoutes);
app.use("/user", userRoute);

app.use("/chart", chartRoute)
app.use(orderRoute);



async function run(chainId: string) {
    try {
        start(chainId);
    }
    catch (error) {
        console.log("Error @ run", error);
    }
}
run("421613");


httpServer.listen(process.env.PORT || 3010, function () {
    console.log("app running on port " + (process.env.PORT || 3010));
});
