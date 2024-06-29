const request = require('supertest');
const app = require('../app');

describe('POST /create_vault', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app)
      .post('/create_vault')
      .query({ chainId: '42161' })
      .set('x-api-key', 'exampleapikey')
      .send({ 
        name: "Algo_Trading_Test_Vault",
        symbol: "LP_ALGT",
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
        trustedProtocols: ["0x111111125421cA6dc452d289314280a0f8842A65", "0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13"],

        quorumPercent: "50",
        minApprovalPercent: "51",
        votingDuration: "5",
        minLpSharePercent: "1"
      });

    console.log(response.body);
    expect(response.statusCode).toBe(200);
  }, 25000);
});

// Add more tests as needed
