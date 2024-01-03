// handleTrading.js

import { initWebSocketConnection } from "../helper/wsConnection.js";
import logic from '../helper/logic.js'



let ws; // WebSocket connection instance

export const handleTrading = (io) => async (req, res) => {
    const { token } = req.body;

    // Initialize WebSocket connection and pass onDataReceived callback
    ws = await initWebSocketConnection(token, (RealTimeData, STOCK_INSTRUMENT) => {
        logic(RealTimeData, STOCK_INSTRUMENT, (result) => {
            // console.log(result);
            io.emit('realTimeData', { data: result });
        });
    });

    if (ws) {
        res.status(200).json({
            success: true
        });
    } else {
        res.status(400).json({
            success: false,
            error: "WebSocket connection failed",
        });
    }
};

export const closeWebSocketConnection = () => {
    if (ws) {
        ws.close();
        console.log('WebSocket connection closed');
    }
};

export default handleTrading;
