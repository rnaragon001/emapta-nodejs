const fs = require('fs');
const fetch = require('node-fetch');

const urlCashIn = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in');
const urlCashOutNatural = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural');
const urlCashOutJuridical = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical');

let currentCutOffDate = '';
let allowanceArray = [];
let userArray = [];
let userWeeklyAllowance;
let userRemainingAllowance;
let adj;
let adjBaseAmount;
let userWeek;
let outputArray = [];

const openInputFile = () => {
  let dataFileJson;
  if (process.argv[2]) {
    const inputFileName = process.argv[2];
    const dataFile = fs.readFileSync(inputFileName);
    dataFileJson = JSON.parse(dataFile);
  } else {
    dataFileJson = [];
  }

  return dataFileJson;
}

const checkCutOffDate = (element, lookBack) => {
  let cutOffDate = new Date(element.date);
  cutOffDate.setDate(cutOffDate.getDate() - lookBack);

  return cutOffDate;
}

const checkWeek = (element, lookBack, dataFileJson) => {
  let currentUser = element.user_id;
  let currentDate = new Date(element.date);
  let cutOffDate = checkCutOffDate(element, lookBack);
  userWeek = dataFileJson
    .filter(trans => {
      trans.date = new Date(trans.date);
      return (
        trans.date >= cutOffDate
        && trans.date <= currentDate
        && trans.user_id === currentUser
        && trans.type === 'cash_out'
        && trans.user_type === 'natural'
      )
    })

  return userWeek;  
}

const computeCashIn = (element, ratesCashIn) => {
  rawCommission = Math.ceil(element.operation.amount*ratesCashIn.percents)/100;
  (rawCommission > ratesCashIn.max.amount) ? limitCommission = ratesCashIn.max.amount : limitCommission = rawCommission; 
  finalCommission = limitCommission.toFixed(2);
  
  return finalCommission;
}

const computeCashOutNatural = (element, ratesCashOutNatural, dataFileJson) => {
  let transDate = new Date(element.date);
  let weekDay = transDate.getDay();
  if (weekDay == 0) {
    // 0 for Sunday and so on...
    lookBack = 6;
  } else if (weekDay > 0 && weekDay < 7) {
    lookBack = weekDay - 1;
  } else {
    console.log('invalid weekday');
  }
  userWeek = checkWeek(element, lookBack, dataFileJson);
  userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
  
  cutOffDate = checkCutOffDate(element, lookBack);
  
  if (currentCutOffDate.valueOf() === cutOffDate.valueOf()) {
    // Within a cutoff
    userArray = allowanceArray.filter(item => {
      return item.user_id === element.user_id;
    })

    if (userArray.length !== 0) {
      // existing cutoff with previous user transaction
      userRemainingAllowance = userArray[0].remainingAllowance;
      userRemainingAllowance = userRemainingAllowance - element.operation.amount;
      allowanceArray = allowanceArray.filter(item => {
        return item.user_id !== element.user_id;
      })
      adj = (userRemainingAllowance > 0) ? userRemainingAllowance : 0;
      adjBaseAmount = (adj === 0) ? Math.abs(userRemainingAllowance) : 0;
    
      allowanceArray.push({"user_id": element.user_id,"remainingAllowance": adj});
    } else {
      // existing cutoff with no previous user transaction
      userWeeklyAllowance = ratesCashOutNatural.week_limit.amount;
      userRemainingAllowance = userWeeklyAllowance;
      userRemainingAllowance = userRemainingAllowance - element.operation.amount;
      adj = (userRemainingAllowance > 0) ? userRemainingAllowance : 0;
      adjBaseAmount = (adj === 0) ? Math.abs(userRemainingAllowance) : 0;
      allowanceArray.push({"user_id": element.user_id,"remainingAllowance": adj});
    }

  } else {
    // New cutoff
    allowanceArray = [];

    currentCutOffDate = cutOffDate;
    
    userWeeklyAllowance = ratesCashOutNatural.week_limit.amount;
    userRemainingAllowance = userWeeklyAllowance;
    
    userRemainingAllowance = userRemainingAllowance - element.operation.amount;
    adj = (userRemainingAllowance > 0) ? userRemainingAllowance : 0;
    adjBaseAmount = (adj === 0) ? Math.abs(userRemainingAllowance) : 0;
    
    allowanceArray.push({"user_id": element.user_id,"remainingAllowance": adj});
  }
  rawCommission = Math.ceil(adjBaseAmount*ratesCashOutNatural.percents)/100;
  limitCommission = rawCommission;
  finalCommission = limitCommission.toFixed(2);
  
  return finalCommission;
}

const computeCashOutJuridical = (element, ratesCashOutJuridical) => {
  rawCommission = Math.ceil(element.operation.amount*ratesCashOutJuridical.percents)/100;
  (rawCommission < ratesCashOutJuridical.min.amount) ? limitCommission = 0 : limitCommission = rawCommission; 
  finalCommission = limitCommission.toFixed(2);

  return finalCommission;
}

const compute = async (dataFileJson) => {
  let responseCashIn = await fetch(urlCashIn)
  let ratesCashIn = await responseCashIn.json()
  let responseCashOutNatural = await fetch(urlCashOutNatural)
  let ratesCashOutNatural = await responseCashOutNatural.json()
  let responseCashOutJuridical = await fetch(urlCashOutJuridical)
  let ratesCashOutJuridical = await responseCashOutJuridical.json()
  
  dataFileJson.forEach(element => {
    switch (element.type) {
      case 'cash_in':
        finalCommission = computeCashIn(element, ratesCashIn);
        outputArray.push(finalCommission.toString());
        console.log(finalCommission);
        break;
      case 'cash_out':
        switch (element.user_type) {
          case 'natural':
            finalCommission = computeCashOutNatural(element, ratesCashOutNatural, dataFileJson);
            outputArray.push(finalCommission.toString());
            console.log(finalCommission);
            break;
          case 'juridical':
            finalCommission = computeCashOutJuridical(element, ratesCashOutJuridical);
            outputArray.push(finalCommission.toString());
            console.log(finalCommission);
            break;
          default:
            console.log('unknown user type');
        }
        break;
      default:
        console.log('unknown transaction type');
    }
  })  
  return outputArray;
}

const app = () => {
  dataFileJson = openInputFile();
  compute(dataFileJson);
}

app();

module.exports = {
  compute,
  computeCashIn,
  computeCashOutNatural,
  computeCashOutJuridical,
}