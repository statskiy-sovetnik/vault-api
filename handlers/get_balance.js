const { Web3 } = require('web3');
const { token_configuration } = require("./utils/token-configuration");
const { arr_merge } = require("./utils/arr-merge");

// TODO add chains support
const rpc_url = 'https://arbitrum.llamarpc.com';
const web3 = new Web3(rpc_url);

exports.get_balance_handler = async function(req, res) {
  const vault_address = req.query.vault;
  const chain_id = await web3.eth.getChainId();

  // TODO validate "vault" is an address

  const TOKEN_ABI = [
    {
      name: 'allowance',
      inputs: [{ type: 'address', name: '_owner' }, { type: 'address', name: '_spender' }],
      outputs: [{ type: 'uint256' }],
      type: 'function',
    },
    {
      name: 'balanceOf',
      inputs: [{ type: 'address', name: 'account' }],
      outputs: [{ type: 'uint256' }],
      type: 'function',
    },
    {
      name: 'decimals',
      outputs: [{ type: 'uint8' }],
      type: 'function',
    },
    {
      name: 'approve',
      inputs: [{ type: 'address', name: 'spender' }, { type: 'uint256', name: "amount" }],
      type: 'function',
    },
    {
      name: "transfer",
      inputs: [{ type: 'address', name: 'recipient' }, { type: 'uint256', name: "_amount" }],
      type: 'function'
    }
  ];
  const VAULT_ABI = [
    {
      name: 'configuration',
      inputs: [],
      outputs: [{ type: 'address' }],
      type: 'function',
    },
  ];
  const CONFIG_ABI = [
    {
      name: 'getTradingTokens',
      inputs: [],
      outputs: [{ type: 'address[]' }],
      type: 'function',
    },
    {
      name: 'getDepositTokens',
      inputs: [],
      outputs: [{ type: 'address[]' }],
      type: 'function',
    },
  ];

  const vault = new web3.eth.Contract(VAULT_ABI, vault_address);
  const configuration_address = await vault.methods.configuration().call();
  const vault_configuration = new web3.eth.Contract(CONFIG_ABI, configuration_address);

  /* 
    Get supported tokens
   */
  const trading_tokens = await vault_configuration.methods.getTradingTokens().call();
  const deposit_tokens = await vault_configuration.methods.getDepositTokens().call();;
  const supported_tokens = arr_merge(trading_tokens, deposit_tokens);

  /* 
    Get balances
   */
  const balances = await getVaultBalances(
    TOKEN_ABI,
    vault_address, 
    supported_tokens
  );
  const info = await formatTokenBalances(
    chain_id,
    supported_tokens,
    balances,
  );
  
  // {code: 200, info: {"USDT": {"non_scaled": "1.0143", "scaled": "1014340"}}
  res.status(200).send(info);
}


async function getVaultBalances(
  TOKEN_ABI,
  vault_address, 
  tokens
) {
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  return await Promise.all(tokens.map(token => {
    if (token === ETH) {
      return web3.eth.getBalance(vault_address);
    }
    else {
      const token_instance = new web3.eth.Contract(TOKEN_ABI, token);
      return token_instance.methods.balanceOf(vault_address).call();
    }
  }));
}


async function formatTokenBalances(
  chain_id,
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

    if (token !== undefined) {
      const decimals = token.decimals;
      const non_scaled = balance_scaled == 0 ? 0 : 
        web3.utils.fromWei(balance_scaled, decimals);

      info[token.baseToken] = {
        scaled: balance_scaled.toString(),
        non_scaled: non_scaled
      }
    }
    else {
      // TODO get manually
    }
    
  }

  return info;
}