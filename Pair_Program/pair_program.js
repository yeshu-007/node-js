
const fs = require('fs').promises;
const EventEmitter = require('events');

const weatherEmitter = new EventEmitter();

weatherEmitter.on('dataFetched', (weather) => {
  console.log("\nWeather Data Fetched Successfully!");
  console.log(`City: ${weather.city}`);
  console.log(`Temperature: ${weather.temperature}°C`);
  console.log(`Condition: ${weather.condition}`);
  console.log(`Humidity: ${weather.humidity}%`);
  console.log(`Rain Probability: ${weather.rain}%`)
});

async function fetchWeatherData() {
  try {
    console.log("Fetching weather data...");

    await new Promise(resolve => setTimeout(resolve, 2000));

    const data = await fs.readFile(__dirname + '/weather.json', 'utf8');

    const weather = JSON.parse(data);

    weatherEmitter.emit('dataFetched', weather);
  } catch (err) {
    console.log("Error reading weather data:", err);
  }
}

fetchWeatherData();
