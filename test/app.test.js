const request = require('supertest');
const app = require('../app');

describe('POST /create_vault', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app)
      .post('/create_vault')
      .query({ chainId: '42161' })
      .set('x-api-key', 'exampleapikey')
      .send({ 
        maxCap: "100",
        minDeposit: "1",
        maxDeposit: "100",
        startTime: "1719298950",
        finishTime: "1719398900",
        withdrawalWindow: "48",
        freezePeriod: "12",
        lockLimit: "2",
        initialPrice: "1",
        canChangeManager: "false",
        canPerformDirectTransfer: "true",
        entranceFee: "1",
        fundManagementFee: "0",
        performanceFee: "0",
        rageQuitFee: "1",
        depositTokens: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
        tradingTokens: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
        trustedProtocols: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"]
      });

    console.log(response.body);
    expect(response.statusCode).toBe(200);
  });
});

// Add more tests as needed
