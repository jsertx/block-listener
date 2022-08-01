export enum ContractType {
	TokenErc20 = "token.erc20",
	UniswapRouterV2Like = "dex.router.uniswap_router_v2_like",
	UniswapFactoryV2Like = "dex.router.uniswap_factory_v2_like",
	UniswapPairV2Like = "dex.router.uniswap_pair_v2_like"
}

export const contractTypeList = Object.values(ContractType);
