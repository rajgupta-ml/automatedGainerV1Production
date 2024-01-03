import axios from 'axios';
import fs from 'fs';
import csv from 'csv-parser';

const handlePrevDayClose = async (req, res) => {
    const apiEndpoint = 'https://api.upstox.com/v2/historical-candle';
    const outputFilePath = 'prevDayClosingPrice.csv';

    const getPreviousDate = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const formattedDate = yesterday.toISOString().split('T')[0];
        return formattedDate;
    };

    const fetchData = async (instrumentKey) => {
        const fromDate = getPreviousDate();
        const encodedInstrumentKey = encodeURIComponent(`NSE_FO|${instrumentKey}`);
        const url = `${apiEndpoint}/${encodedInstrumentKey}/day/${fromDate}`;
        
        try {
            // console.log(url)
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'api-version': '2.0'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching data for ${instrumentKey}: ${error.message}`);
            throw error;
        }
    };

    const csvStream = fs.createWriteStream(outputFilePath);
    csvStream.write('Symbol,ClosingPrice,Company Name\n');

    const delayBetweenRequests = Math.ceil(60 * 1000 / 250);
    const promises = [];

    fs.createReadStream('C:/Users/prati/OneDrive/Documents/automate_trading/server/controller/data.csv')
        .pipe(csv())
        .on('data', (row) => {
            console.log(row["ISIN Code"]);
            const instrumentKey = row["ISIN Code"];
            const companyName = row["Company Name"];
            // console.log(instrumentKey);
            const promise = fetchDataWithDelay(instrumentKey, companyName,delayBetweenRequests, csvStream);
            promises.push(promise);
        })
        .on('end', async () => {
            setTimeout(() => {
                csvStream.end();
                console.log('CSV file closed');
            }, 2500); // Adjust the delay as needed

            await Promise.all(promises);
            console.log('CSV file processed');
            res.status(200).json({ success: true, message: 'CSV file processed successfully' });
        });

    const fetchDataWithDelay = async (instrumentKey, companyName, delay, csvStream) => {
        try {
            const responseData = await handleRetryOnRateLimit(() => fetchData(instrumentKey));
            const closingPrice = responseData.data.candles[0][4];
            csvStream.write(`${instrumentKey},${closingPrice},${companyName}\n`);
            console.log(`Data for ${instrumentKey} saved to CSV`);
        } catch (error) {
            console.error(`Error fetching data for ${instrumentKey}: ${error.message}`);
        } finally {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };

    const handleRetryOnRateLimit = async (fn, maxRetries = 4) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    console.log(`Rate limit exceeded. Retrying... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay if needed
                } else {
                    throw error;
                }
            }
        }
        throw new Error(`Max retries reached.`);
    };
};

export default handlePrevDayClose;
