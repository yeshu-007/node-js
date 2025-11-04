const fs = require('fs');
const EventEmitter = require('events');

const weatherEmitter = new EventEmitter();

weatherEmitter.on('fetch', (mini) => {
  console.log('\nWeather Data Fetched!');
  console.log(`City: ${mini.city}`);
  console.log(`Temperature: ${mini.temperature}°C`);
  console.log(`Condition: ${mini.condition}`);
    console.log(`Humidity: ${mini.humidity}%`);
  console.log(`Rain Probability: ${mini.rain}%`)
});

fs.readFile(`${__dirname}/mini.json`, 'utf8', (err, data) => {
  if (err) {
    console.log('❌ Error reading weather file:', err);
    return;
  }

  const weather = JSON.parse(data);

  weatherEmitter.emit('fetch', weather);
});
