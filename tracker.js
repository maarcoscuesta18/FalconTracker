const {Builder, By, Key, until} = require("selenium-webdriver");
require('dotenv').config()
const {TwitterApi} = require('twitter-api-v2')

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

async function postTweet(altitude, current_speed, current_location, vertical_speed, image) {
    const mediaId = await client.v1.uploadMedia(Buffer.from(image, 'base64'), { type: 'png' });
    await client.v1.tweet(
            "Altitude: " + altitude + "m, Speed: " + current_speed + "m/s, Vertical Speed: " + vertical_speed + "m/s, Location: " + current_location,
            {media_ids: mediaId}
    ).then(function (data) {
        console.log(data);
    }).catch(function (err) {
        console.log(err);
    });
}
(async function getAircraftData() {
    let driver = await new Builder().forBrowser("chrome").build();
    try {

        await driver.get('https://globe.adsbexchange.com/?icao=3542c3');

        var altitude = await driver.findElement(By.id('selected_altitude1')).getText();
        var current_speed = await driver.findElement(By.id('selected_speed1')).getText();
        current_speed = parseFloat(current_speed.replace("kt", '').trim())*1852;
        var current_location = await driver.findElement(By.id('selected_position')).getText();
        var vertical_speed = await driver.findElement(By.id('selected_vert_rate')).getText();
        var image = await driver.takeScreenshot();


        postTweet(altitude, current_speed, current_location, vertical_speed, image);
       
    } finally {
        await driver.quit();
    }
//Nota: para al final deberemos colocar (); para que se inicie la ejecución
})();
