const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs');
const excelReader = require('./excel');
const organizer = require('./organizer');
const downloader = require('./downloader');
const exceljs = require('exceljs');

var mp4_link = '';
var workbook = new exceljs.Workbook();
var array_new = [0];

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        headless: false,
        ignoreHTTPSErrors: true,
        userDataDir: './tmp',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
        ],
    });

    const page = await browser.newPage();

    const preloadFile = fs.readFileSync('./preload.js', 'utf8');
    await page.evaluateOnNewDocument(preloadFile);

    // await page.emulate(devices.devicesMap['iPhone X']);
    
	page.on('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.dismiss();
    });

    let rows = await excelReader.getExcel('./intellect.xlsx')
    let first = true;

    page.on('response', async resp => {
        if(resp.request().resourceType() === 'fetch') {
            let url = resp.url();
            if(url.includes('mp4')) {
                url = url.split('&bytestart=');
                if(url != undefined && mp4_link == '') {
                    mp4_link = url[0];
                }
            }
        }
    });

    let rplus = 2;
    for(let row of rows) {
        if(first) {
            first = false;
        }
        else {
            await organizer.writeDirectory(rplus);
            rplus++;

            let link = row[16];
            let tries = 1;
            
            while(tries < 6) {
                try {
                    console.log('try number: ', tries);
                    tries++;
                    console.log('on link: ', link);

                    await page.goto(link, {
                        waitUntil: 'networkidle2',
                        timeout: 10000,
                    });

                    let captcha = await page.evaluate(() => {
                        let doc = document.querySelector('#captcha');
                        return doc != null;
                    });

                    if(captcha) {
                        await page.waitFor(120000);
                    }
        
                    let res = await page.evaluate((row) => {
                        console.log(1);
        
                        if(row[18] == 'none') {
                            console.log("exiting with ''... none");
                            return [];
                        }
        
                        let post = document.querySelector('._3ccb');
                        if(post == null) {
                            console.log(2);
                            return [];
                        }
        
                        let mtm = post.querySelector('.mtm');
                        if(mtm == null) {
                            console.log(3);
                            return 1;
                        }
        
                        let aces = mtm.querySelectorAll('a');
                        let media_links = [];
                        
                        for(let ele of aces) {
                            let img = ele.querySelector('img');
                            if(img != null) {
                                console.log(img.src);
                                media_links.push({
                                    'link': img.src,
                                    'nature': 'image',
                                });
                            }
                        }
        
                        console.log(media_links);
        
                        if(media_links.length == 0) {
                            console.log(4);
                            return 1;
                        }
                        console.log(5);
        
                        return media_links;
        
                    }, row);
        
                    if(res == 1) {
                        res = [];
                        if(mp4_link != '') {
                            res.push({
                                'link': mp4_link,
                                'nature': 'video',
                            });
                            mp4_link = '';
                        }
                    }
        
                    let counter = 1;
                    if(res.length == 0) {
                        array_new.push('');
                    }
                    else {
                        for(ele of res) {
                            if(ele.nature == 'image') {
                                await downloader.downloadRetry(ele.link, `./result/${rplus}/${counter}.jpg`, 5);
                                if(counter == 1) {
                                    array_new.push(`=HYPERLINK("result/${rplus}/${counter}.jpg", "${ele.nature}")`);
                                }
                            }
                            else if(ele.nature == 'video') {
                                // await downloader.downloadRetry(ele.link, `./result/${rplus}/${counter}.mp4`, 5);
                                if(counter == 1) {
                                    array_new.push(``);
                                }
                            }
                            counter++;
                        }
                    }
        
                    await page.waitFor(1000);
                    break;
                } catch(err) {
                    console.log(err);
                    console.log("=====================================");
                    console.log('line: ', rplus);
                    console.log('link: ', row[16]);
                    console.log("=====================================");
                }
            }
        }
    }

    workbook.xlsx.readFile('./intellect.xlsx')
        .then(() => {
            let worksheet = workbook.getWorksheet(1);
            for(let i = 2; i < 100; i++) {
                let row = worksheet.getRow(i);
                row.getCell(19).value = array_new[i];
                row.commit();
            }
            return workbook.xlsx.writeFile('new.xlsx');
        });

})();