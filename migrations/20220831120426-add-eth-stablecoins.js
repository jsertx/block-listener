/* eslint-disable no-undef */
module.exports = {
	async up(db, client) {
		const EthDai = {
			address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
			blockchain: "ethereum",
			decimals: 18,
			name: "Dai Stablecoin",
			symbol: "DAI",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const EthFrax = {
			address: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
			blockchain: "ethereum",
			decimals: 18,
			name: "Frax",
			symbol: "FRAX",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const EthBusd = {
			address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
			blockchain: "ethereum",
			decimals: 18,
			name: "Binance USD",
			symbol: "BUSD",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};
		const EthTusd = {
			address: "0x0000000000085d4780B73119b644AE5ecd22b376",
			blockchain: "ethereum",
			decimals: 18,
			name: "TrueUSD",
			symbol: "TUSD",
			useAsBaseForPairDiscovery: true,
			isNativeWrapped: false,
			isStable: true
		};

		await db
			.collection("tokens")
			.insertMany([EthDai, EthFrax, EthBusd, EthTusd]);
	},

	async down(db, client) {}
};
