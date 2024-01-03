import express, { json } from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { createServer } from "http";
import handleLoginController  from "./controller/handleLoginController.js";
import handleVerificationController from "./controller/handleVerificationController.js";
import handleLogout from "./controller/handleLogout.js";
import handleTrading from "./controller/handleTrading.js";
import handlePrevDayClose from "./helper/handlePrevDayLow.js";
import handleStopLoss from "./controller/handleStopLoss.js";

import path from "path"

const app = express();
const _dirname = path.dirname("")
const buildPath = path.join(_dirname, "/dist");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'https://kgautotrade.in', // Set the actual origin of your client application
    methods: ['GET', 'POST'],
    credentials: true, // Enable credentials (cookies, authorization headers)
  },
});



app.use(cors());
app.use(json())
app.use(cookieParser());

app.use(express.static(buildPath));

const PORT = 8080  


app.get("/*", (req, res) => {
  res.sendFile(path.join(_dirname, "/dist/index.html"), (err) => {
    if(err){
      res.status(500).send(err);
    }
  })
})


app.get('/api/auth', handleLoginController)
app.post ('/api/verify-access-code', handleVerificationController)
app.post ('/api/logout', handleLogout)
app.post ('/api/start-trading', handleTrading(io))
app.get("/api/handle-get-prev-day-close", handlePrevDayClose)
app.post("/api/handle-stoploss", handleStopLoss)
httpServer.listen(PORT, () => {
    console.log(`The server is running on ${PORT}`)
})