const {Builder, By, Key, until} = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const { delayed } = require("selenium-webdriver/lib/promise");
require('dotenv').config()
const {TwitterApi} = require('twitter-api-v2');

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});
const aircraftsUrl = ["341391","3542c3","3542c4","3542c5"]
const aircraftsModel = ["Falcon 2 (T.18-2)","Falcon 3 (T.18-3)","Falcon 4 (T.18-4)","Falcon 5 (T.18-5)"]
var already_posted = false;
var altitude = "none";
function isLanding(current_altitude) {
    if (parseInt(altitude.replace("▲","").replace("▼","").replace("ft","").trim()) < 10000 && (altitude!=="none" && (current_altitude!=="n/a" || current_altitude!=="on ground") && altitude!=="on ground") || 
    (current_altitude==="on ground" && altitude!=="on ground" && altitude!=="none")) {
        altitude = current_altitude;
        return true;
    }else{
        altitude = current_altitude;
        return false;
    }
}
function isTakingOff(current_altitude) {
    if (((current_altitude !== "on ground" && parseInt(current_altitude.replace("▲","").replace("▼","").replace("ft","").trim()) < 10000) && (altitude==="n/a" && current_altitude!=="n/a")  || 
    (altitude==="on ground" && current_altitude !== "on ground"))) {
        altitude = current_altitude;
        return true;
    }else{
        altitude = current_altitude;
        return false;
    }
}

async function postTweet(aircraftUsed,current_altitude, current_speed, current_location, vertical_speed, image) {
    if (already_posted) {
        return;
    }else{
        if(isLanding(current_altitude)){
            const mediaId = await client.v1.uploadMedia(Buffer.from(image, 'base64'), { type: 'png' });
            await client.v1.tweet(
                "El gobierno de España esta aterrizando el Falcon. Datos del Evento:\n Modelo: "+aircraftsModel[aircraftUsed]+" Altitud: " + altitude + " m\n Velocidad Actual: " + current_speed + " m/s\n Velocidad Vertical: " + vertical_speed + " m/s\n Coordenadas: " + current_location,
                {media_ids: mediaId}
                ).then(function (data) {
                    console.log(data);
                }).catch(function (err) {
                    console.log(err);
            });
            already_posted = true;
        } else if(isTakingOff(current_altitude)){
            const mediaId = await client.v1.uploadMedia(Buffer.from(image, 'base64'), { type: 'png' });
            await client.v1.tweet(
                "El gobierno de España esta despegando el Falcon. Datos del Evento:\n Modelo: "+aircraftsModel[aircraftUsed]+" Altitud: " + altitude + " m\n Velocidad Actual: " + current_speed + " m/s\n Velocidad Vertical: " + vertical_speed + " m/s\n Coordenadas: " + current_location,
                {media_ids: mediaId}
                ).then(function (data) {
                    console.log(data);
                }).catch(function (err) {
                    console.log(err);
                });
                already_posted = true;
            }
        }
    }
    
(async function getAircraftData() {    
    let options = new chrome.Options();
    options.addArguments("--headless");
    options.addArguments("--disable-gpu");
    options.addArguments("--no-sandbox");
    for (let i = 0; i < aircraftsUrl.length; i++) {
        already_posted = false;
        altitude = "none";
        for (let j = 0; j < 2; j++) {
            // Go to the page
            let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
            try {
                await driver.get("https://globe.adsbexchange.com/?icao="+ aircraftsUrl[i]);
                    
                //get the data
                var current_altitude = await driver.findElement(By.id('selected_altitude1')).getText();
                if (altitude === "" && j==1) {
                    altitude = current_altitude;
                }
                var current_speed = await driver.findElement(By.id('selected_speed1')).getText();
                current_speed = parseFloat(current_speed.replace("kt", '').trim())*1.852;
                var current_location = await driver.findElement(By.id('selected_position')).getText();
                var current_vertical_speed = await (await driver.findElement(By.id('selected_vert_rate')).getText()).replace("ft","pies");
                var image = await driver.takeScreenshot();
                console.log(current_altitude);
                //post the tweet	
                postTweet(i,current_altitude, current_speed, current_location, current_vertical_speed, image);
            } catch (error) {
                console.log(error);
            } finally {
                await driver.quit();
            }
        }
    }      
    //Nota: para al final deberemos colocar (); para que se inicie la ejecución
})();
