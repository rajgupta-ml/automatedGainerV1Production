import { initWebSocketConnection } from "../helper/wsConnection.js";
import fs from 'fs';
import axios from "axios"

const STATE_FILE_PATH = 'state.json';

let RealTimePosition = [];
const processedInstruments = new Set();
let ws;
let GlobalRealTimeData;
let GlobalStockInstrument;

// Function to load state from a file
function loadStateFromFile() {
    try {
        // Check if the file exists
        if (fs.existsSync(STATE_FILE_PATH)) {
            const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
            const parsedData = JSON.parse(data);

            RealTimePosition = parsedData.RealTimePosition || [];
            parsedData.processedInstruments.forEach(instrument => processedInstruments.add(instrument));

            console.log('State loaded from file.');
        } else {
            // If the file doesn't exist, initialize arrays
            RealTimePosition = [];
            processedInstruments.clear();

            console.log('State file not found. Initializing empty state.');
        }
    } catch (error) {
        console.error('Error loading state from file:', error);
    }
}


// Load state on server startup
loadStateFromFile();



const initWebSocket = async (token) => {
    ws = await initWebSocketConnection(token, (RealTimeData, STOCK_INSTRUMENT) => {
            GlobalRealTimeData = RealTimeData;
            GlobalStockInstrument = STOCK_INSTRUMENT;
    });
};

const handleStopLoss = async (req, res,) => {
    const { orderBook, token } = req.body; 
    try {
        if(ws){
            orderBook.forEach(order => {
                const matchingInstrument = GlobalStockInstrument.find(instrument => instrument === order.instrument);

                if (!processedInstruments.has(matchingInstrument)) {
                    const price = GlobalRealTimeData.feeds[matchingInstrument]?.ff?.marketFF?.ltpc?.ltp;
                    if (price !== undefined) {
                        RealTimePosition.push({
                            instrument: matchingInstrument,
                            ltp: price,
                            price: order.price,
                            side: order.side,
                            hasSL: false
                        });

                        processedInstruments.add(matchingInstrument);
                    }
                }


                res.status(200).json({
                    success: true
                })
            });
            // Save state to a file after each RealTimeData update
            saveStateToFile();
            CreateStopLossOder(token);
        }else{
            await initWebSocket(token)
        }

    } catch (error) {
        console.error('Error in handleStopLoss:', error);
    }

    // ...
};

const stoplossOrder = []

const CreateStopLossOder = (token) => {
    RealTimePosition.forEach((order => {
        const percentageChange = ((order.ltp - order.price) / order.price) * 100;
        if(percentageChange > 0.25 && !order.hasSL && order.side == "BUY"){
            // addSL({instrument: order.instrument, side: order.side, price: order.price, token})
            stoplossOrder.push({instrument: order.instrument, side: "SELL", price: order.price, token})
            order.hasSL = true;
            console.log(stoplossOrder)
        }else if(percentageChange < -0.25 && !order.hasSL && order.side == "SELL"){
            // addSL({instrument: order.instrument, side: order.side, price: order.price, token})
            stoplossOrder.push({instrument: order.instrument, side: "BUY", price: order.price, token})
            order.hasSL = true;
        }
        saveStateToFile();
    }))
} 
function saveStateToFile() {
    const instrumentMap = new Map();
    RealTimePosition.forEach((order) => {
        if (instrumentMap.has(order.instrument)) {
            const existingOrder = instrumentMap.get(order.instrument);
            if (!existingOrder.hasSL && order.hasSL) {
                instrumentMap.set(order.instrument, order);
            }
        } else {
            instrumentMap.set(order.instrument, order);
        }
    });
    const isDuplicatePresent = RealTimePosition.length !== Array.from(instrumentMap.values()).length;
    const uniqueRealTimePosition = isDuplicatePresent
        ? Array.from(instrumentMap.values()).filter((order) => order.hasSL)
        : RealTimePosition;

    const stateToSave = {
        RealTimePosition: uniqueRealTimePosition,
        processedInstruments: Array.from(processedInstruments)
    };

    try {
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(stateToSave), 'utf8');
        console.log('State saved to file.');
    } catch (error) {
        console.error('Error saving state to file:', error);
    }
}


const addSL = async ({ instrument, side, price, token }) => {
    let config = {
        headers: {
            "api-version": 2.0,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "accept": "application/json"
        }
    };

    try {
        const response = await axios.post(
            `https://api.upstox.com/v2/order/place`,
            {
                quantity: 1,
                product: "D",
                validity: "DAY",
                price: "0",
                instrument_token: instrument,
                order_type: "SL-M",
                transaction_type: side == "BUY" ? "SELL" : "BUY", // Assuming 'side' should be used here
                disclosed_quantity: 0,
                trigger_price: price,
                is_amo: "False"
            },
            config
        );

        // Handle the response as needed
        console.log('Order placed:', response.data);
    } catch (error) {
        // Handle errors
        console.error('Error placing order:', error);
    }
};



export default handleStopLoss;
