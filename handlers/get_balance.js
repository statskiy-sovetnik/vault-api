const { Web3 } = require('web3');
const { token_configuration } = require("./utils/token-configuration");
const { arr_merge } = require("./utils/arr-merge");
const { abi } = require("./utils/abi");
const { chain_config } = require("./utils/chain-configuration")


let chain_id;
let web3;

exports.get_balance_handler = async function(req, res) {
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
    Set up and verify the vault contracts
   */
  let vault;
  let configuration_address;
  let vault_configuration;
  const vault_address = req.query.vault;
  try {
    vault = new web3.eth.Contract(abi.ASPIS_POOL_ABI, vault_address);
    configuration_address = await vault.methods.configuration().call();
    vault_configuration = new web3.eth.Contract(
      abi.ASPIS_CONFIGURATION_ABI, 
      configuration_address
    );
  }
  catch(e) {
    res.status(400).send("Incorrect vault address");
  }

  /* 
    Get supported tokens
   */
  let info;
  try {
    const trading_tokens = await vault_configuration.methods.getTradingTokens().call();
    const deposit_tokens = await vault_configuration.methods.getDepositTokens().call();;
    const supported_tokens = arr_merge(trading_tokens, deposit_tokens);

    /* 
      Get balances
    */
    const balances = await getVaultBalances(
      vault_address, 
      supported_tokens
    );
    info = await formatTokenBalances(
      supported_tokens,
      balances,
    );
  }
  catch(e) {
    res.status(500).send("get_balance: Internal server error")
  }
  
  // {code: 200, info: {"USDT": {"non_scaled": "1.0143", "scaled": "1014340"}}
  res.status(200).send(info);
}


async function getVaultBalances(
  vault_address, 
  tokens
) {
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  return await Promise.all(tokens.map(token => {
    if (token === ETH) {
      return web3.eth.getBalance(vault_address);
    }
    else {
      const token_instance = new web3.eth.Contract(abi.ERC_20_ABI, token);
      return token_instance.methods.balanceOf(vault_address).call();
    }
  }));
}


async function formatTokenBalances(
  supported_tokens, 
  balances,
) {
  const info = {};

  for (let i = 0; i < supported_tokens.length; i++) {
    const token_address = supported_tokens[i];
    const balance_scaled = balances[i];
    const token = token_configuration[chain_id].tokens.find(_token => {
      return _token.tokenAddress === token_address;
    });

    let decimals;
    let symbol;

    /* 
      Get symbol and decimals from config file or fetch manually
     */
    if (token !== undefined) {
      decimals = token.decimals;
      symbol = token.baseToken;
    }
    else {
      const token_instance = new web3.eth.Contract(abi.ERC_20_ABI, token_address);
      symbol = await token_instance.methods.symbol().call();
      decimals = await token_instance.methods.decimals().call();
      decimals = Number(decimals);
    }
    
    const non_scaled = balance_scaled == 0 ? 0 : 
      web3.utils.fromWei(balance_scaled, decimals);

    info[symbol] = {
      scaled: balance_scaled.toString(),
      non_scaled: non_scaled
    }
  }

  return info;
}