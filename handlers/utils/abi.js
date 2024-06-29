exports.abi = {
  ASPIS_POOL_ABI: [
    {
      name: 'configuration',
      inputs: [],
      outputs: [{ type: 'address' }],
      type: 'function',
    },
    {
      name: "DAO_CONFIG_ROLE",
      inputs: [],
      outputs: [{ type: 'address' }],
      type: 'function',
    }
  ],

  ERC_20_ABI: [
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
      name: 'symbol',
      outputs: [{ type: 'string' }],
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
  ],

  ASPIS_CONFIGURATION_ABI: [
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
  ],

  ASPIS_POOL_FACTORY: [
    {
      name: "newERC20AspisPoolDAO",
      inputs: [
          {
              "name": "_aspisPoolConfig",
              "type": "tuple",
              "components": [
                  { "name": "poolConfig", "type": "uint256[16]" },
                  { "name": "name", "type": "string" },
                  { "name": "symbol", "type": "string" }
              ]
          },
          {
              "name": "_voteConfig",
              "type": "uint64[4]"
          },
          {
              "name": "_addressArrays",
              "type": "address[][4]"
          }
      ],
      outputs: [
          { "name": "_pool", "type": "address" },
          { "name": "_voting", "type": "address" },
          { "name": "_token", "type": "address" },
          { "name": "_configuration", "type": "address" }
      ],
      type: "function"
    }
  ]
}