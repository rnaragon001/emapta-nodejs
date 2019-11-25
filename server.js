const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();

let inputFileName = process.argv[2];
// console.log(inputFileName);
let data = fs.readFileSync(inputFileName);

let urlCashIn = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in');
let urlCashOutNatural = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural');
let urlCashOutLegal = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical');

let jsonData = JSON.parse(data);
// let jsonCashIn = JSON.parse(urlCashIn);
let status; 
fetch(urlCashIn)
  .then((res) => { 
    status = res.status; 
    return res.json() 
  })
  .then((jsonData) => {
    console.log(jsonData);
    console.log(status);
  })
  .catch((err) => {
    // handle error for example
    console.error(err);
  });


// let jsonCashOutNatural = JSON.parse(urlCashOutNatural);
// let jsonCashOutLegal = JSON.parse(urlCashOutLegal);

// console.log(jsonData);
// jsonData.forEach(element => console.log(element.operation.amount, element.type))
// console.log(jsonCashIn);


app.get('/', (req, res) => {
    res.send('this is working');
})

app.listen(3000, ()=> {
    console.log ('app is running on port 3000.')
})