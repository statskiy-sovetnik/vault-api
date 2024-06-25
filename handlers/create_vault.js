const { Web3 } = require('web3');
const { chain_config } = require("./utils/chain-configuration");
const { create_vault_schema } = require('./schemas/create_vault_schema');
const Joi = require('joi');


let chain_id;
let web3;

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

  res.status(200).send(params);
  
}
