const assert = require('chai').assert;
const app = require('../app');

const inputJson = [
    { "date": "2016-01-05", "user_id": 1, "user_type": "natural", "type": "cash_in", "operation": { "amount": 200.00, "currency": "EUR" } },
    { "date": "2016-01-06", "user_id": 2, "user_type": "juridical", "type": "cash_out", "operation": { "amount": 300.00, "currency": "EUR" } },
    { "date": "2016-01-06", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 30000, "currency": "EUR" } },
    { "date": "2016-01-07", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 1000.00, "currency": "EUR" } },
    { "date": "2016-01-07", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 100.00, "currency": "EUR" } },
    { "date": "2016-01-10", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 100.00, "currency": "EUR" } },
    { "date": "2016-01-10", "user_id": 2, "user_type": "juridical", "type": "cash_in", "operation": { "amount": 1000000.00, "currency": "EUR" } },
    { "date": "2016-01-10", "user_id": 3, "user_type": "natural", "type": "cash_out", "operation": { "amount": 1000.00, "currency": "EUR" } },
    { "date": "2016-02-15", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 300.00, "currency": "EUR" } }
]

const outputArray = [
    '0.06',
    '0.90',
    '87.00',
    '3.00',
    '0.30',
    '0.30',
    '5.00',
    '0.00',
    '0.00',
]

const cashInRates = {
    percents: 0.03,
    max: {
    amount: 5,
    currency: "EUR"
    }
}

const cashOutNaturalRates = {
    percents: 0.3,
    week_limit: {
    amount: 1000,
    currency: "EUR"
    }
}

const cashOutJuridicalRates = {
    percents: 0.3,
    min: {
    amount: 0.5,
    currency: "EUR"
    }
}

//Results
computeCashInResult = app.computeCashIn(inputJson[0], cashInRates);
computeCashOutNaturalResult = app.computeCashOutNatural(inputJson[2], cashOutNaturalRates, inputJson);
computeCashOutJuridicalResult = app.computeCashOutJuridical(inputJson[1], cashOutJuridicalRates);
// computeResult = await app.compute(inputJson);

describe('App', () => {
    it('computeCashIn should return cash in commission', function(){
        assert.equal(computeCashInResult, 0.06);
    });

    it('computeCashOutNatural should return cash out natural commission', function(){
        assert.equal(computeCashOutNaturalResult, 87.00);
    });    

    it('computeCashOutJuridical should return cash out juridical commission', function(){
        assert.equal(computeCashOutJuridicalResult, 0.90);
    });    

    it('compute should return inputJson commission', async function(){
        try {
            let result = await app.compute(inputJson);
            assert.equal(result, outputArray);
        } catch {
            console.error();
        }
    });    
})