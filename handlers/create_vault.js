const { Web3, validator } = require('web3');
const { chain_config } = require("./utils/chain-configuration");
const { create_vault_schema } = require('./schemas/create_vault_schema');
const Joi = require('joi');
const { DynamoDBClient, PutItemCommand } = require ("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require ("@aws-sdk/lib-dynamodb");
const { getAwsSecret } = require('./utils/get-aws-secret');
const { create_vault_config } = require("./config/create_vault_config")
const { abi } = require("./utils/abi");


let chain_id;
let web3;
const dbclient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbclient);


exports.create_vault_handler = async function(req, res) {
  chain_id = req.query.chainId;
  let rpc_url;

  try {
    rpc_url = chain_config[chain_id].rpc_url;
    web3 = new Web3(rpc_url);
  }
  catch {
    res.status(400).send("Chain configuration error");
    return;
  }

  /* 
    Validate and transform body parameters
   */
  let params;

  try {
    params = Joi.attempt(
      req.body, 
      create_vault_schema, 
      "/create_vault parameter validation error: "
    );
  }
  catch(err) {
    console.log(err);
    res.status(400).send(`Invalid request parameters`);
    return;
  }

  /* 
    Create a vault manager account and save to Dynamo
   */
  let vault_manager;
  try {
    const api_key = req.get('x-api-key');
    vault_manager = web3.eth.accounts.create();

    if (!api_key) {
      throw new Error("Bad api key");
    }

    await saveAccount(api_key, vault_manager.address, vault_manager.privateKey);

    console.log("Vault manager: ", vault_manager.address);
  }
  catch(err) {
    console.log(err);
    res.status(500).send(`Couldn't save an account: ${err.message}`);
    return;
  }

  /* 
    Sponsor the new account
  */
  try {
    await sponsorAccount(vault_manager.address);
  }
  catch(err) {
    console.log(err);
    res.status(500).send(`Failed to sponsor the new account: ${err.message}`);
    return;
  }

  /* 
    Initialize factory and Create vault
   */
  let vault;
  try {
    const poolFactory = new web3.eth.Contract(
      abi.ASPIS_POOL_FACTORY, 
      create_vault_config[chain_id].aspisPoolFactory
    );

    // Add a vault manager to the wallet
    web3.eth.accounts.wallet.add(vault_manager.privateKey);
  
    const newDaoParams = convertToFactoryParams(params);

    // Create vault
    const tx = await deployVault(poolFactory, vault_manager.address, newDaoParams);
    
    // Decode logs
    vault = decodePoolFromLogs(tx, poolFactory.options.address);
    console.log("New vault: ", vault);

    if (!vault) {
      throw new Error("Failed to decode the vault address");
    }
  }
  catch(err) {
    console.log(err);
    res.status(500).send(`Failed to create a new vault: ${err.message}`);
    return;
  }

  /* 
    Save the vault data to database
   */
  try {
    await saveVault(vault, vault_manager.address);
  }
  catch(err) {
    console.log(err);
    res.status(500).send(`Dynamo Error: ${err.message}`);
    return;
  }

  res.status(200).send({
    vault: vault,
    vault_manager: vault_manager.address
  });
}


async function saveAccount(api_key, address, private_key) {
  const command = new PutCommand({
    TableName: "Accounts",
    Item: {
      apiKey: api_key,
      address: address,
      privateKey: private_key
    },
  });

  const response = await docClient.send(command);
  console.log(response);
  return response;
}

async function saveVault(
  vault_address,
  vault_manager_address,
) {
  const currentDate = new Date();
  const isoDate = currentDate.toISOString(); 
  
  const params = {
    TableName: "Vaults",
    Item: {
      "chainId": { S: chain_id.toString() },
      "vaultAddress": { S: vault_address },
      "vaultManagerAddress": { S: vault_manager_address },
      "createdAt": { S: isoDate }
    }
  };

  await dbclient.send(new PutItemCommand(params));
}

async function sponsorAccount(address) {
  const gas_sponsor_pk = await getAwsSecret("GasSponsorPK", "GasSponsorPK");
  const gas_sponsor_address = web3.eth.accounts.privateKeyToAddress(gas_sponsor_pk);

  web3.eth.accounts.wallet.add(gas_sponsor_pk);
  console.log("Gas sponsor: ", gas_sponsor_address);

  const sponsor_value_eth = web3.utils.toWei(
    create_vault_config[chain_id].sponsorEthValue, 
    "ether"
  ); 

  const tx = {
    from: gas_sponsor_address,
    to: address,
    value: sponsor_value_eth,
  };

  const gas = await web3.eth.estimateGas(tx);
  await web3.eth.sendTransaction({
    ...tx,
    gas: (gas + 5000n).toString()
  });
}

function convertToFactoryParams(params) {
  const aspisPoolConfig = [
    [
      params.maxCap.toString(),
      params.minDeposit.toString(),
      params.maxDeposit.toString(),
      params.startTime.toString(),
      params.finishTime.toString(),
      params.withdrawalWindow.toString(),
      params.freezePeriod.toString(),
      params.lockLimit.toString(),
      params.spendingLimit.toString(),
      params.initialPrice.toString(),
      params.canChangeManager ? "1" : "0",
      params.entranceFee.toString(),
      params.fundManagementFee.toString(),
      params.performanceFee.toString(),
      params.rageQuitFee.toString(),
      params.canPerformDirectTransfer ? "1" : "0",
    ],
    params.name.toString(),
    params.symbol.toString()
  ];

  const voteConfig = [
    params.quorumPercent.toString(),
    params.minApprovalPercent.toString(),
    params.votingDuration.toString(),
    params.minLpSharePercent.toString()
  ];

  const addressArrays = [
    [], // whitelisted users
    params.trustedProtocols,
    params.depositTokens,
    params.tradingTokens,
  ];

  return [aspisPoolConfig, voteConfig, addressArrays];
}

async function deployVault(
  poolFactory,
  vault_manager_address,
  params
) {
  // Estimate gas
  const gasAmount = await poolFactory.methods.newERC20AspisPoolDAO(
    ...params
  ).estimateGas();

  const gasForTx = (gasAmount + 100000n).toString();
  const gasPrice = await web3.eth.getGasPrice();
  const gasPriceForTx = (gasPrice * 110n / 100n).toString();
  console.log("Gas for vault creation: ", gasForTx);

  /* const data = poolFactory.methods.newERC20AspisPoolDAO(
    ...newDaoParams
  ).encodeABI();
  console.log("Calldata: ", data); */
  const tx = await poolFactory.methods.newERC20AspisPoolDAO(
    ...params
  ).send({
    from: vault_manager_address,
    gas: gasForTx,
    gasPrice: gasPriceForTx
  });
  return tx;
}

function decodePoolFromLogs(tx, pool_factory_address) {
  // The only log of the Aspis Pool Factory is "DAOCreated"
  //console.log(tx.logs);
  const DaoCreatedLog = tx.logs.find(log => {
    return web3.utils.toChecksumAddress(log.address) === 
      web3.utils.toChecksumAddress(pool_factory_address);
  });

  const params = web3.eth.abi.decodeParameters([
    "address", // pool
    "string",  // name
    "address", // token 
    "address",  // voting
    "address" // configuration
  ], DaoCreatedLog.data);

  return params[0];
}
