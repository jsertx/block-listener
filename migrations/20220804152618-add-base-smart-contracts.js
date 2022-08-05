/* eslint-disable no-undef */
module.exports = {
	async up(db, client) {
		const UniswapV2Router = {
			address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
			blockchain: "ethereum",
			alias: "uniswap.v2.router",
			createdAt: "2022-07-25T17:34:48.567Z",
			type: "dex.router.uniswap_router_v2_like"
		};
		const UniswapV2Factory = {
			blockchain: "ethereum",
			address: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
			alias: "uniswap.v2.factory",
			data: {
				dex: "uniswap"
			},
			createdAt: "2022-07-25T23:44:12.978Z",
			type: "dex.router.uniswap_factory_v2_like"
		};

		const PolygonQuickSwapV2Router = {
			address: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
			blockchain: "polygon",
			alias: "quickswap.v2.router",
			createdAt: "2022-08-02T22:52:43.684Z",
			type: "dex.router.uniswap_router_v2_like"
		};
		const PolygonQuickSwapV2Factory = {
			blockchain: "polygon",
			address: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
			alias: "quickswap.v2.factory",
			data: {
				dex: "quickswap"
			},
			createdAt: "2022-08-02T22:53:32.226Z",
			type: "dex.router.uniswap_factory_v2_like"
		};

		const EthereumWeth = {
			address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
			blockchain: "ethereum",
			symbol: "WETH",
			name: "Wrapped Ether",
			decimals: 18,
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: true,
			isStable: false
		};
		const EthereumUsdc = {
			address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			blockchain: "ethereum",
			symbol: "USDC",
			name: "USD Coin",
			decimals: 6,
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const EthereumUsdt = {
			address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
			blockchain: "ethereum",
			decimals: 6,
			name: "Tether USD",
			symbol: "USDT",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const PolygonWmatic = {
			address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
			blockchain: "polygon",
			symbol: "WMATIC",
			name: "Wrapped Matic",
			decimals: 18,
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: true,
			isStable: false
		};
		const PolygonUsdc = {
			address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
			blockchain: "polygon",
			symbol: "USDC",
			name: "USD Coin",
			decimals: 6,
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const PolygonUsdt = {
			address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
			blockchain: "polygon",
			decimals: 6,
			name: "Tether USD",
			symbol: "USDT",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};

		await db
			.collection("contracts")
			.insertMany([
				UniswapV2Router,
				UniswapV2Factory,
				PolygonQuickSwapV2Router,
				PolygonQuickSwapV2Factory
			]);

		await db
			.collection("tokens")
			.insertMany([
				EthereumUsdc,
				EthereumWeth,
				EthereumUsdt,
				PolygonUsdc,
				PolygonWmatic,
				PolygonUsdt
			]);
	},

	async down(db, client) {
		await db.collection("contracts").drop();
		await db.collection("tokens").drop();
	}
};
