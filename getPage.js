const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { convertArrayToCSV } = require('convert-array-to-csv');
const fs = require('fs/promises');

const link = 'https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/';

let pagesData = [];
let maxPage = 5;
let currentPage = 1;
const whitelist = [
    'www.dns-shop.ru',
    'a.dns-shop.ru',
];

const getPage = async (url) => {
    puppeteer.use(StealthPlugin());


    const browser = await puppeteer.launch({
        headless: 'new',
        args: []
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {


        if (whitelist.includes(new URL(request.url()).host)) {
            if (['image', 'stylesheet', 'font', 'other', 'eventsource', 'media', 'texttrack', 'manifest', 'font'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        } else request.abort()

    });

    listener = page.on('response', response => {

        if (response.url().indexOf('/product-buy') !== -1) {
            (async function () {
                try {
                    const resp = await response.json();
                    const data = await resp.data.states;
                    data.forEach(el => {
                        const name = el.data.name;
                        const price = el.data.price.current;
                        pagesData.push({ name, price });
                    });
                    console.log('page ' + currentPage);
                    currentPage += 1;
                } catch (err) {
                    throw err;
                } finally {
                    if (currentPage > maxPage) {
                        const csvFromArrayOfObjects = convertArrayToCSV(pagesData);
                        fs.writeFile('data.csv', csvFromArrayOfObjects, (err) => {
                            if (err) console.log(58, err);
                        }).then(res => {
                            console.log('>>>>>>> complete');
                            process.exit(0);
                        })
                    }
                    await page.goto(link + '?p=' + currentPage);
                };
            }());
        };
    });

    await page.goto(url);

}

getPage(link);


module.exports = getPage;