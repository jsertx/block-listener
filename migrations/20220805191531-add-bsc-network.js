/* eslint-disable no-undef */
module.exports = {
	async up(db, client) {
		const PancakeV2Router = {
			address: "0x10ed43c718714eb63d5aa57b78b54704e256024e",
			blockchain: "bsc",
			alias: "pancakeswap.v2.router",
			createdAt: "2022-07-25T17:34:48.567Z",
			type: "dex.router.uniswap_router_v2_like"
		};
		const PancakeV2Factory = {
			blockchain: "bsc",
			address: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
			alias: "pancakeswap.v2.factory",
			data: {
				dex: "pancakeswap"
			},
			createdAt: "2022-07-25T23:44:12.978Z",
			type: "dex.router.uniswap_factory_v2_like"
		};

		const BscWBNB = {
			address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
			blockchain: "bsc",
			symbol: "WBNB",
			name: "Wrapped BNB",
			decimals: 18,
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: true,
			isStable: false
		};
		const BscUsdc = {
			address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
			blockchain: "bsc",
			symbol: "USDC",
			name: "USD Coin",
			decimals: 6,
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const BscBUsd = {
			address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
			blockchain: "bsc",
			decimals: 6,
			name: "Binance USD",
			symbol: "BUSD",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};

		await db
			.collection("contracts")
			.insertMany([PancakeV2Router, PancakeV2Factory]);

		await db.collection("tokens").insertMany([BscUsdc, BscWBNB, BscBUsd]);
	},

	async down(db, client) {}
};
