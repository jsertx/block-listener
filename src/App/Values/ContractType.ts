export enum ContractType {
  TokenErc20 = "token.erc20",
  UniswapRouterV2Like = "dex.router.uniswap_router_v2_like",
  MevBot = "bot.mev",
  ArbBot = "bot.arbitrage",
}

export const contractTypeList = Object.values(ContractType);
