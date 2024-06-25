const { Web3 } = require('web3');
const { chain_config } = require("./utils/chain-configuration");


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

}
