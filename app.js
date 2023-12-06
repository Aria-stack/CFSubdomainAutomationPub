require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const port = 3048;

const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ZONE_ID = process.env.CF_ZONE_ID;
let defaultDomainName = '';  // 存储默认域名

app.get('/', (req, res) => {
    res.send('CFSubdomainAutomation is running');
});
function processCSV() {
    fs.createReadStream('./pending.csv')
        .pipe(csv({
        }))
        .on('data', (row) => {
            console.log('Parsed CSV row:', row);
            addOrUpdateDNSRecord(row);
        })
        .on('end', () => {
            console.log('CSV file processing completed.');
        });
}
async function addOrUpdateDNSRecord(record) {
    const url = `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`;
    const fullDomainName = record.name + '.' + (record.domainname || defaultDomainName);

    const dnsRecord = {
        type: record.type,
        name: fullDomainName,
        content: record.content,
        ttl: 1 // 或者自定义 TTL
    };

    console.log('Attempting to add/update DNS record:', dnsRecord);

    try {
        const response = await axios.post(url, dnsRecord, {
            headers: {
                Authorization: `Bearer ${CF_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log(`Record added/updated for ${fullDomainName}`);
        } else {
            console.error(`Error adding/updating record for ${fullDomainName}: `, response.data.errors);
        }
    } catch (error) {
        console.error(`Error in addOrUpdateDNSRecord: ${error}`);
        if (error.response) {
            console.error(error.response.data);
        }
    }
}

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    processCSV();
});
