const {Builder, By, Key, until} = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const { delayed } = require("selenium-webdriver/lib/promise");
require('dotenv').config()
const {TwitterApi} = require('twitter-api-v2');
const { sleepSecs } = require("twitter-api-v2/dist/v1/media-helpers.v1");

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});
const secondsDelay= 300;
const aircraftsUrl = ["341391","3542c3","3542c4","3542c5"]
const aircraftsModel = ["Falcon 2 (T.18-2)","Falcon 3 (T.18-3)","Falcon 4 (T.18-4)","Falcon 5 (T.18-5)"]

var altitude = null;
var current_speed = null;
var vertical_speed = null;

function isLanding(altitude, current_altitude) {
    if ((parseInt(altitude.replace("▲","").replace("▼","").replace("ft","").trim()) < 10000 && (altitude !== "on ground" || altitude !== "n/a"))||
    (altitude !== "on ground" && current_altitude === "on ground")) {
        return true;
    }else{
        return false;
    }
}
function isTakingOff(altitude, current_altitude) {
    if ((current_altitude !== "on ground" && parseInt(current_altitude.replace("▲","").replace("▼","").replace("ft","").trim()) < 10000 && altitude==="n/a" && current_altitude!=="n/a")  || 
        altitude==="on ground") {
        return true;
    }else{
        return false;
    }
}

async function postTweet(aircraftUsed,altitude,current_altitude, current_speed, current_location, vertical_speed, image) {
    const mediaId = await client.v1.uploadMedia(Buffer.from(image, 'base64'), { type: 'png' });
    if(isLanding(altitude, current_altitude)){
        await client.v1.tweet(
                "El gobierno de España esta aterrizando el Falcon. Datos del Evento:\n Modelo: "+aircraftsModel[aircraftUsed]+" Altitud: " + altitude + "m\n Velocidad Actual: " + current_speed + "m/s\n Velocidad Vertical: " + vertical_speed + "m/s\n Coordenadas: " + current_location,
                {media_ids: mediaId}
        ).then(function (data) {
            console.log(data);
        }).catch(function (err) {
            console.log(err);
        });
    } else if(isTakingOff(altitude, current_altitude)){
        await client.v1.tweet(
            "El gobierno de España esta despegando el Falcon. Datos del Evento:\n Modelo: "+aircraftsModel[aircraftUsed]+" Altitud: " + altitude + "m\n Velocidad Actual: " + current_speed + "m/s\n Velocidad Vertical: " + vertical_speed + "m/s\n Coordenadas: " + current_location,
            {media_ids: mediaId}
        ).then(function (data) {
            console.log(data);
        }).catch(function (err) {
            console.log(err);
        });
    }
}

for (let i = 0; i < 2; i++) {
    (async function getAircraftData() {    
        let options = new chrome.Options();
        options.addArguments("--headless");
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
        for (let i = 0; i < aircraftsUrl.length; i++) {
            try {
                // Go to the page
                await driver.get("https://globe.adsbexchange.com/?icao=" + aircraftsUrl[i]);
                
                //get the data
                var current_altitude = await driver.findElement(By.id('selected_altitude1')).getText();
                var current_speed = await driver.findElement(By.id('selected_speed1')).getText();
                current_speed = parseFloat(current_speed.replace("kt", '').trim())*1852;
                var current_location = await driver.findElement(By.id('selected_position')).getText();
                var current_vertical_speed = await (await driver.findElement(By.id('selected_vert_rate')).getText()).replace("ft","pies");
                var image = await driver.takeScreenshot();
                
                //post the tweet	
                postTweet(i,current_altitude,altitude, current_speed, current_location, current_vertical_speed, image);
            } catch (error) {
                console.log(error);
            } finally {
                await driver.quit();
            }
        }      
        //Nota: para al final deberemos colocar (); para que se inicie la ejecución
    })();
    await sleepSecs(millisecondsDelay);
}