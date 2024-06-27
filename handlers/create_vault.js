const { Web3 } = require('web3');
const { chain_config } = require("./utils/chain-configuration");
const { create_vault_schema } = require('./schemas/create_vault_schema');
const Joi = require('joi');
const { DynamoDBClient } = require ("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require ("@aws-sdk/lib-dynamodb");
const { getAwsSecret } = require('./utils/get-aws-secret');


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
  }

  /* 
    Create a vault manager account and save to Dynamo
   */
  let acc;
  try {
    const api_key = req.get('x-api-key');
    acc = web3.eth.accounts.create();

    if (!api_key) {
      throw new Error("Bad api key");
    }

    await saveAccount(api_key, acc.address, acc.private_key);
  }
  catch(err) {
    console.log(err);
    res.status(500).send(`Couldn't save an account: ${err.message}`);
  }

  /* 
    Sponsor the new account
  */
  try {
    await sponsorAccount(acc.address);
  }
  catch(err) {
    console.log(err);
    res.status(500).send(`Failed to sponsor the new account: ${err.message}`);
  }

  /* 
    Create vault
   */
  

  res.status(200).send(params);
}


async function saveAccount(api_key, address, private_key) {
  const command = new PutCommand({
    TableName: "Accounts",
    Item: {
      ApiKey: api_key,
      Account: address,
      PrivateKey: private_key
    },
  });

  const response = await docClient.send(command);
  console.log(response);
  return response;
}


async function sponsorAccount(address) {
  const gas_sponsor_pk = await getAwsSecret("GasSponsorPK", "GasSponsorPK");
  const gas_sponsor = web3.eth.accounts.wallet.add(gas_sponsor_pk);
  const sponsor_value_eth = web3.utils.toWei("0.0001", "ether"); 

  await web3.eth.sendTransaction({ // internally sign transaction using wallet
    from: gas_sponsor[0].address,
    to: address,
    value: sponsor_value_eth
 });
}
