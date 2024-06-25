const Joi = require('joi');

const MAX_UINT256 = (2n ** 256n - 1n).toString();
const PRICE_MULTIPLIER = 10000;
const FEE_MULTIPLIER = 100;


exports.create_vault_schema = Joi.object({
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
    .custom(fee => fee * FEE_MULTIPLIER),

  fundManagementFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee => fee * FEE_MULTIPLIER),

  performanceFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee => fee * FEE_MULTIPLIER),

  rageQuitFee: Joi.number()  // percent, not scaled
    .min(0)
    .max(100)
    .required()
    .custom(fee => fee * FEE_MULTIPLIER),

  depositTokens: Joi.array() // array of strings
    .items(Joi.string().required())
    .required(), 

  tradingTokens: Joi.array()
    .items(Joi.string().required())
    .required(),

  trustedProtocols: Joi.array()
    .items(Joi.string())
    .required(),
});
