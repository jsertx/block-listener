import { inject } from "inversify";
import {
	interfaces,
	controller,
	httpGet,
	httpPost,
	requestBody,
	requestParam,
	response
} from "inversify-express-utils";

import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../../../App/Utils/Validation";
import { Wallet, WalletRaw } from "../../../App/Entities/Wallet";
import { CreateWalletDto, CreateWalletDtoSchema } from "../Dto/WalletDto";
import { IWalletRepository } from "../../../App/Repository/IWalletRepository";
import { IBroker } from "../../../Interfaces/IBroker";
import { BlockchainId } from "../../../Config/Blockchains";
import { WhaleDiscovered } from "../../../App/PubSub/Messages/WhaleDiscovered";
import { Response } from "express";

@controller("/wallets")
export class WalletController implements interfaces.Controller {
	constructor(
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.Broker)
		private broker: IBroker
	) {}

	@httpGet("/")
	async index(): Promise<IApiPaginatedResponse<WalletRaw>> {
		const { data } = await this.walletRepository.findAll();
		return buildPaginatedResponse({
			data: data.map((data) => data.toRaw())
		});
	}

	@httpPost("/")
	async createWallet(
		@requestBody() body: CreateWalletDto
	): Promise<IApiResponse> {
		validateOrThrowError(body, CreateWalletDtoSchema);
		const wallet = await this.walletRepository.save(
			Wallet.create({ ...body, createdAt: new Date() })
		);
		return {
			success: true,
			data: wallet.toRaw()
		};
	}

	@httpPost("/async/:blockchain/:address")
	async saveTx(
		@requestParam("blockchain") blockchain: BlockchainId,
		@requestParam("address") address: string,
		@response() res: Response
	) {
		await this.broker.publish(
			new WhaleDiscovered(blockchain, { blockchain, address })
		);
		return res.sendStatus(202);
	}
}
