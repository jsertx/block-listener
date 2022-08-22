import "reflect-metadata";
import "dotenv/config";
import { initializeContainer } from "../src/Ioc/container";

import { IocKey } from "../src/Ioc/IocKey";
import { ITokenRepository } from "../src/App/Repository/ITokenRepository";
import { Wallet } from "../src/App/Entities/Wallet";
import { IWalletRepository } from "../src/App/Repository/IWalletRepository";

(async () => {
	const container = await initializeContainer();
	const { data } = await container
		.get<ITokenRepository>(IocKey.TokenRepository)
		.findAll();

	const wallets = data
		.filter((t) => !t.symbol)
		.map((t) => new Wallet(t.props as any));

	await container
		.get<IWalletRepository>(IocKey.WalletRepository)
		.saveMany(wallets);
	console.log("done");
})();
