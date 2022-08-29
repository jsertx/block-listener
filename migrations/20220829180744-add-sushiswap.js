/* eslint-disable no-undef */
module.exports = {
	async up(db, client) {
		const SushiswapV2Router = {
			address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
			blockchain: "ethereum",
			alias: "sushiswap.v2.router",
			createdAt: new Date(),
			type: "dex.router.uniswap_router_v2_like"
		};
		const SushiswapV2Factory = {
			blockchain: "ethereum",
			address: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
			alias: "sushiswap.v2.factory",
			data: {
				dex: "sushiswap"
			},
			createdAt: new Date(),
			type: "dex.router.uniswap_factory_v2_like"
		};

		await db
			.collection("contracts")
			.insertMany([SushiswapV2Router, SushiswapV2Factory]);
	},

	async down(db, client) {}
};
