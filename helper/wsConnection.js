// wsConnection.js

import { WebSocket } from 'ws';
import protobuf from 'protobufjs';
import csv from 'csv-parser';
import fs from 'fs';
import axios from 'axios';

let protobufRoot = null;
const NIFT_100 = [];
const STOCK_INSTRUMENT = [];
let ws = null;

export const initWebSocketConnection = async (token, onDataReceived) => {
    const options = {
        headers: {
            'accept': 'application/json',
            'Api-Version': '2.0',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await axios.get("https://api-v2.upstox.com/feed/market-data-feed/authorize", options);
        const weburi = response.data.data.authorizedRedirectUri;

        async function initProtobuf() {
            protobufRoot = await protobuf.load('./controller/MarketDataFeed.proto');
            console.log("Protobuf part initialization complete");
        }

        await initProtobuf();

        ws = new WebSocket(weburi, {
            headers: {
                "Api-Version": "2.0",
                "Authorization": `Bearer ${token}`
            },
            followRedirects: true
        });
       
            ws.on('open', function open() {
                console.log('connected');
    
                fs.createReadStream('./controller/data.csv').pipe(csv()).on('data', (data) => {
                    NIFT_100.push(data);
                }).on('end', () => {
                    console.log("DATA IS READ");
                    NIFT_100.map((instrument) => {
                        STOCK_INSTRUMENT.push( `NSE_FO|${instrument['ISIN Code']}`);
                    });
    
                    setTimeout(function timeout() {
                        const data = {
                            guid: "someguid",
                            method: "sub",
                            data: {
                                mode: "full",
                                instrumentKeys: STOCK_INSTRUMENT
                            }
                        };
                        ws.send(Buffer.from(JSON.stringify(data)));
                    }, 1000);
                });
    
                ws.on('message', function message(data) {
                    const RealTimeData = decodeProtobuf(data);
                    onDataReceived(RealTimeData, STOCK_INSTRUMENT);
                });
            });

            ws.on("error", function error(e) {
                console.log(e);
            })
            ws.on('close', function close(event) {
                console.log('disconnected: ', event);
            });

            function decodeProtobuf(buffer) {
                if (protobufRoot == null) {
                    console.warn("Protobuf part not initialized yet!");
                    return null;
                }
            
                const FeedResponse = protobufRoot.lookupType("com.upstox.marketdatafeeder.rpc.proto.FeedResponse");
                return FeedResponse.decode(buffer);
            }
            

        return ws;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const isWebSocketConnected = () => {
    return ws !== null && ws.readyState === WebSocket.OPEN;
};






