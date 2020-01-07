const fs = require('fs');
const fetch = require('node-fetch');

const inputFileName = process.argv[2];
const dataFile = fs.readFileSync(inputFileName);

const urlCashIn = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in');
const urlCashOutNatural = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural');
const urlCashOutJuridical = ('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical');

const dataFileJson = JSON.parse(dataFile);
const dataArray = dataFileJson.map(dataItem => {
  return dataItem;
});

const checkWeek = (dataArray, element, lookBack) => {
  let currentUser = element.user_id;
  let currentDate = new Date(element.date);    
  let weekDay = currentDate.getDay();
  cutOffDate = new Date(currentDate);
  cutOffDate.setDate(currentDate.getDate() - lookBack);
  userWeek = dataArray
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
}

const compute = async () => {
  let currentCutOffDate = '';
  let allowanceArray = [];
  let userArray = [];
  let userWeeklyAllowance;
  let userRemainingAllowance;
  let adj;
  let adjBaseAmount;

  let responseCashIn = await fetch(urlCashIn)
  let ratesCashIn = await responseCashIn.json()
  let responseCashOutNatural = await fetch(urlCashOutNatural)
  let ratesCashOutNatural = await responseCashOutNatural.json()
  let responseCashOutJuridical = await fetch(urlCashOutJuridical)
  let ratesCashOutJuridical = await responseCashOutJuridical.json()
  
  dataFileJson.forEach(element => {
    switch (element.type) {
      case 'cash_in':
        rawCommission = Math.ceil(element.operation.amount*ratesCashIn.percents)/100;
        (rawCommission > ratesCashIn.max.amount) ? limitCommission = ratesCashIn.max.amount : limitCommission = rawCommission; 
        finalCommission = limitCommission.toFixed(2);
        console.log(finalCommission);
        break;
      case 'cash_out':
        switch (element.user_type) {
          case 'natural':
            let transDate = new Date(element.date);
            let weekDay = transDate.getDay();
            switch (weekDay) {
              case 0:
                // Sunday
                lookBack = 6;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              case 1:
                // Monday
                lookBack = 0;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              case 2:
                // Tuesday
                lookBack = 1;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              case 3:
                // Wednesday
                lookBack = 2;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              case 4:
                // Thursday
                lookBack = 3;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              case 5:
                // Friday
                lookBack = 4;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              case 6:
                //Saturday
                lookBack = 5;
                checkWeek(dataArray, element, lookBack);
                userWeekUse = userWeek.reduce((acc, trans) => acc + trans.operation.amount, 0);
                break;
              default:
                null;
            } 
            // console.log('user: ', element.user_id, transDate, 'day of week: ', weekDay);
            if (currentCutOffDate.valueOf() === cutOffDate.valueOf()) {
              // Within a cutoff
              // console.log('cutOffDate: ', cutOffDate);
              // console.log('currentCutOffDate: ', currentCutOffDate);
              
              userArray = allowanceArray.filter(item => {
                return item.user_id === element.user_id;
              })

              if (userArray.length !== 0) {
                // existing cutoff with previous user transaction
                userRemainingAllowance = userArray[0].remainingAllowance;
                // console.log('Old Allowance: ', userRemainingAllowance);
                // console.log('Amount: ', element.operation.amount);
                userRemainingAllowance = userRemainingAllowance - element.operation.amount;
                // console.log('Old Allowance Array: ', allowanceArray);
                allowanceArray = allowanceArray.filter(item => {
                  return item.user_id !== element.user_id;
                })
                adj = (userRemainingAllowance > 0) ? userRemainingAllowance : 0;
                adjBaseAmount = (adj === 0) ? Math.abs(userRemainingAllowance) : 0;
                // console.log('base: ', adjBaseAmount);

                allowanceArray.push({"user_id": element.user_id,"remainingAllowance": adj});
                // console.log('New Allowance Array: ', allowanceArray);
                // console.log('Remaining Allowance: ', userRemainingAllowance);    
              } else {
                // existing cutoff with no previous user transaction
                userWeeklyAllowance = ratesCashOutNatural.week_limit.amount;
                userRemainingAllowance = userWeeklyAllowance;
                // console.log('Old Allowance Array: ', allowanceArray);
                // console.log('Previous Allowance: ', userRemainingAllowance);
                userRemainingAllowance = userRemainingAllowance - element.operation.amount;
                adj = (userRemainingAllowance > 0) ? userRemainingAllowance : 0;
                adjBaseAmount = (adj === 0) ? Math.abs(userRemainingAllowance) : 0;
                // console.log('base: ', adjBaseAmount);
                allowanceArray.push({"user_id": element.user_id,"remainingAllowance": adj});
                
                // console.log('New Allowance Array: ', allowanceArray);
                // console.log('Amount: ', element.operation.amount);
                // console.log('Remaining Allowance: ', userRemainingAllowance);   
              }
          
            } else {
              // New cutoff
              allowanceArray = [];
              // console.log('new cutoff');
              // console.log('old cutoff: ', currentCutOffDate);
              currentCutOffDate = cutOffDate;
              // console.log('cutOffDate: ', cutOffDate);
              // console.log('new cutoff: ', currentCutOffDate);

              userWeeklyAllowance = ratesCashOutNatural.week_limit.amount;
              userRemainingAllowance = userWeeklyAllowance;
              // console.log('Old Allowance Array: ', allowanceArray);
              // console.log('Previous Allowance: ', userRemainingAllowance);

              userRemainingAllowance = userRemainingAllowance - element.operation.amount;
              adj = (userRemainingAllowance > 0) ? userRemainingAllowance : 0;
              // console.log('adj: ', adj);
              adjBaseAmount = (adj === 0) ? Math.abs(userRemainingAllowance) : 0;
              // console.log('base: ', adjBaseAmount);
              
              allowanceArray.push({"user_id": element.user_id,"remainingAllowance": adj});
              // console.log('New Allowance Array: ', allowanceArray);
              // console.log('Amount: ', element.operation.amount);
              // console.log('Remaining Allowance: ', userRemainingAllowance);  
            }
            rawCommission = Math.ceil(adjBaseAmount*ratesCashOutNatural.percents)/100;
            limitCommission = rawCommission;
            finalCommission = limitCommission.toFixed(2);
            console.log(finalCommission);
            break;
          case 'juridical':
            rawCommission = Math.ceil(element.operation.amount*ratesCashOutJuridical.percents)/100;
            (rawCommission < ratesCashOutJuridical.min.amount) ? limitCommission = 0 : limitCommission = rawCommission; 
            finalCommission = limitCommission.toFixed(2);
            console.log(finalCommission);
            break;
          default:
            console.log('default');
        }
        break;
      default:
        console.log('default');
    }
  })  
}

const app = () => {
  compute();
}

app();

module.exports = {
  app,
  compute,
}