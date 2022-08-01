import { inject } from "inversify";
import {
	interfaces,
	controller,
	httpGet,
	queryParam,
	httpPost,
	requestParam,
	response
} from "inversify-express-utils";
import { TxType } from "../../../App/Values/TxType";
import { ITxRepository } from "../../../App/Repository/ITxRepository";
import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { TxSimplifiedDto } from "../Dto/TxDto";
import { IBroker } from "../../../Interfaces/IBroker";
import { TxDiscovered } from "../../../App/PubSub/Messages/TxDiscovered";
import { BlockchainId } from "../../../Config/Blockchains";
import { Response } from "express";

@controller("/txs")
export class TxController implements interfaces.Controller {
	constructor(
		@inject(IocKey.TxRepository) private txRepository: ITxRepository,
		@inject(IocKey.Broker) private broker: IBroker
	) {}
	@httpGet("/")
	async getAll(
		@queryParam("page") _page: string,
		@queryParam("pageSize") _pageSize: string
	): Promise<IApiPaginatedResponse<TxSimplifiedDto>> {
		return this.getTransferByType(undefined, _page, _pageSize);
	}
	@httpGet("/eth")
	async getAllTransfers(
		@queryParam("page") _page: string,
		@queryParam("pageSize") _pageSize: string
	): Promise<IApiPaginatedResponse<TxSimplifiedDto>> {
		return this.getTransferByType(TxType.EthTransfer, _page, _pageSize);
	}

	@httpGet("/unknown")
	async getAllUnknown(
		@queryParam("page") _page: string,
		@queryParam("pageSize") _pageSize: string
	): Promise<IApiPaginatedResponse<TxSimplifiedDto>> {
		return this.getTransferByType(TxType.Unknown, _page, _pageSize);
	}

	async getTransferByType(
		type: TxType | undefined,
		_page: string,
		_pageSize: string
	): Promise<IApiPaginatedResponse<TxSimplifiedDto>> {
		const { data, page, pageSize, total } = await this.txRepository.findAll(
			{
				where: type ? { type } : undefined,
				page: _page ? Number(_page) : 1,
				pageSize: _pageSize ? Number(_pageSize) : 500
			}
		);
		return buildPaginatedResponse({
			total,
			page,
			pageSize,
			data: data.map((tx) => {
				return {
					hash: tx.hash,
					blockchain: tx.blockchain.id,
					type: tx.type,
					timestamp: tx.timestamp,
					block: tx.block,
					data: tx.data
				};
			})
		});
	}

	@httpPost("/save/:blockchain/:hash")
	async saveTx(
		@requestParam("blockchain") blockchain: BlockchainId,
		@requestParam("hash") hash: string,
		@response() res: Response
	) {
		await this.broker.publish(
			new TxDiscovered(blockchain, { blockchain, hash })
		);
		return res.sendStatus(202);
	}
}
