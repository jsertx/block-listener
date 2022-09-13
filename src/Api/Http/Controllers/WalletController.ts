import { inject } from "inversify";
import {
	interfaces,
	controller,
	httpGet,
	httpPost,
	requestBody,
	response,
	queryParam
} from "inversify-express-utils";

import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponseEmpty } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../../../App/Utils/Validation";
import { WalletRaw } from "../../../App/Entities/Wallet";
import { CreateWalletDto, CreateWalletDtoSchema } from "../Dto/WalletDto";
import { IWalletRepository } from "../../../App/Repository/IWalletRepository";
import { IBroker } from "../../../Interfaces/IBroker";
import { WalletDiscovered } from "../../../App/PubSub/Messages/WalletDiscovered";
import { Response } from "express";
import { WalletTagName } from "../../../App/Values/WalletTag";

@controller("/wallets")
export class WalletController implements interfaces.Controller {
	constructor(
		@inject(IocKey.WalletRepository)
		private walletRepository: IWalletRepository,
		@inject(IocKey.Broker)
		private broker: IBroker
	) {}

	@httpGet("/")
	async index(
		@queryParam("page") _page: string,
		@queryParam("pageSize") _pageSize: string
	): Promise<IApiPaginatedResponse<WalletRaw>> {
		const { data, page, pageSize, total } =
			await this.walletRepository.findAll({
				page: _page ? Number(_page) : 1,
				pageSize: _pageSize ? Number(_pageSize) : 500
			});

		return buildPaginatedResponse({
			total,
			page,
			pageSize,
			data: data.map((data) => data.toRaw())
		});
	}

	@httpPost("/")
	async createWallet(
		@requestBody() body: CreateWalletDto,
		@response() res: Response
	): Promise<Response> {
		validateOrThrowError(body, CreateWalletDtoSchema);
		const tags = body.tags || [];
		await this.broker.publish(
			new WalletDiscovered({
				...body,
				tags: [...tags, WalletTagName.AddedManually]
			})
		);
		const resBody: IApiResponseEmpty = { success: true };
		return res.status(202).send(resBody);
	}
}
