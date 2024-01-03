// logic.js

import fs from 'fs';
import csv from 'csv-parser';

const calculatePercentageChange = (ltp, prevDayClosingP) => (
  prevDayClosingP !== 0 ? ((ltp - prevDayClosingP) / prevDayClosingP) * 100 : 0
);

let qty = null;
let prevDayClosingPricesCache = null;

const readCSVFile = (filePath) => {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        console.log('CSV file read complete');
        resolve(data);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
};

const logic = async (RealTimeData, STOCK_INSTRUMENT, callback) => {
  let snapShot = null;
  if (!prevDayClosingPricesCache && !qty) {
    try {
      prevDayClosingPricesCache = await readCSVFile("C:/Users/prati/OneDrive/Documents/automate_trading/server/prevDayClosingPrice.csv");
      qty = await readCSVFile("C:/Users/prati/OneDrive/Documents/automate_trading/server/controller/data.csv")
    } catch (error) {
      callback({ error: 'Error reading CSV' });
      return;
    }
  }

  const TodayOhlcData = STOCK_INSTRUMENT.filter(instrument => RealTimeData.feeds[instrument] !== undefined).map(instrument => ({instrument,closingPrice: RealTimeData.feeds[instrument]["ff"]["marketFF"]["ltpc"]["ltp"],
    }));


    const snapShotRank = () => {
      snapShot = STOCK_INSTRUMENT.filter(instrument => RealTimeData.feeds[instrument] !== undefined).map(instrument => ({instrument,closingPrice: RealTimeData.feeds[instrument]["ff"]["marketFF"]["ltpc"]["ltp"],

    }));

    }



    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();


    if(hour === 9 && min === 15){
      snapShotRank();
    }


  STOCK_INSTRUMENT.forEach(instrument => {
    const ltp = (TodayOhlcData.find(item => item.instrument === instrument) || {}).closingPrice;
    let snapShotLtp = null;
    let snapShotPercentageChangeValue = null;
    const prevDayClosingP = (prevDayClosingPricesCache.find(row => `NSE_FO|${row["Symbol"]}` === instrument) || {}).ClosingPrice || 0;
    const percentageChangeValue = calculatePercentageChange(ltp, parseFloat(prevDayClosingP));
    if(snapShot){
      snapShotLtp = (TodayOhlcData.find(item => item.instrument === instrument) || {}).closingPrice;
      snapShotPercentageChangeValue = calculatePercentageChange(snapShotLtp, parseFloat(prevDayClosingP));
    
    }


    if (percentageChangeValue !== 0) {
      callback({
        instrument,
        snapShotPercentageChangeValue,
        qty: (qty.find(row => `NSE_FO|${row["ISIN Code"]}` === instrument) || {})["Qty"],
        percentageChange: percentageChangeValue,
        ltp,
        prevDayClosingP,
        companyName: (prevDayClosingPricesCache.find(row => `NSE_FO|${row["Symbol"]}` === instrument) || {})["Company Name"],
      });
    }
  });
};

export default logic;
