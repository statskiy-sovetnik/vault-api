const Joi = require('joi');

const MAX_UINT256 = (2n ** 256n - 1n).toString();
const PRICE_MULTIPLIER = 10000;
const FEE_BASE = 10000;
const PERCENT_BASE = 10n**18n;


const fee_scaler = (fee) => {
  return Math.floor(Number(fee) * FEE_BASE / 100)
}

const governance_percent_scaler = (percent) => {
  return BigInt(percent) * PERCENT_BASE / 100n;
}


exports.create_vault_schema = Joi.object({
  name: Joi.string()
    .token()
    .min(3)
    .max(30)
    .required(),

  symbol: Joi.string()
    .token()
    .min(3)
    .max(10)
    .uppercase()
    .required(),

  maxCap: Joi.number()  // fundraising target, USDC not scaled
    .min(1)
    .integer()
    .required(),

  minDeposit: Joi.number() // USDC not scaled
    .integer()
    .min(0)
    .default(0),

  maxDeposit: Joi.number() // USDC not scaled
    .min(0)
    .integer()
    .greater(Joi.ref('minDeposit'))
    .default(MAX_UINT256),

  startTime: Joi.number()
    .min(0)
    .integer()
    .greater(1719298900)
    .required(),

  finishTime: Joi.number()
    .integer()
    .min(0)
    .greater(Joi.ref('startTime'))
    .required(),

  withdrawalWindow: Joi.number() // hours
    .integer()
    .min(0)
    .greater(1)
    .required(),
  
  freezePeriod: Joi.number() // hours
    .integer()
    .min(0)
    .greater(1)
    .required(),

  lockLimit: Joi.number()  // hours
    .integer()
    .min(0)
    .required(),

  spendingLimit: Joi.number()
    .integer()
    .min(0)
    .default(0),
  
  initialPrice: Joi.number() // USD, not scaled
    .min(0)
    .greater(0.1)
    .required()
    .custom(priceUnscaled => priceUnscaled * PRICE_MULTIPLIER),

  canChangeManager: Joi.boolean()
    .required(),
  
  canPerformDirectTransfer: Joi.boolean()
    .required(),

  entranceFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee_scaler),

  fundManagementFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee_scaler),

  performanceFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee_scaler),

  rageQuitFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee_scaler),

  depositTokens: Joi.array() // array of strings
    .items(Joi.string().required())
    .required(), 

  tradingTokens: Joi.array()
    .items(Joi.string().required())
    .required(),

  trustedProtocols: Joi.array()
    .items(Joi.string())
    .required(),

  /* governance */
  quorumPercent: Joi.number()  // percent, not scaled
    .min(1)
    .max(100)
    .required()
    .custom(governance_percent_scaler),

  minApprovalPercent: Joi.number()  // percent, not scaled
    .min(1)
    .max(100)
    .required()
    .custom(governance_percent_scaler),

  votingDuration: Joi.number()  // hours
    .integer()
    .min(1)
    .required(),

  minLpSharePercent: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(governance_percent_scaler),
});
