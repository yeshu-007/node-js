var fs = require("fs");

console.log('SYNC: step by step, by blocking and executing 1st step')
var data = fs.readFileSync('input.txt');

console.log(data.toString());
console.log("Program ended")


console.log('\nASYNC: no block and steps not executed in order')
fs.readFile('input.txt', function (err, data) {
    if (err)
        return console.error(err);

    console.log(data.toString())
});

console.log("Program Ended")