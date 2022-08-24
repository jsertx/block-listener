import { inject } from "inversify";
import {
	interfaces,
	controller,
	httpGet,
	httpPost,
	requestBody,
	queryParam
} from "inversify-express-utils";

import { IocKey } from "../../../Ioc/IocKey";
import { IApiPaginatedResponse, IApiResponse } from "../Types/Response";
import { buildPaginatedResponse } from "../Utils/Response";
import { validateOrThrowError } from "../Utils/Validation";
import { Contract, ContractRaw } from "../../../App/Entities/Contract";
import { CreateContractDto, CreateContractDtoSchema } from "../Dto/ContractDto";
import { IContractRepository } from "../../../App/Repository/IContractRepository";

@controller("/contracts")
export class ContractController implements interfaces.Controller {
	constructor(
		@inject(IocKey.ContractRepository)
		private contractRepository: IContractRepository
	) {}

	@httpGet("/")
	async index(
		@queryParam("page") _page: string,
		@queryParam("pageSize") _pageSize: string
	): Promise<IApiPaginatedResponse<ContractRaw>> {
		const { data, page, pageSize, total } =
			await this.contractRepository.findAll({
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
	async createContract(
		@requestBody() body: CreateContractDto
	): Promise<IApiResponse> {
		validateOrThrowError(body, CreateContractDtoSchema);
		const contract = await this.contractRepository.save(
			Contract.create({ ...body, data: undefined, createdAt: new Date() })
		);
		return {
			success: true,
			data: contract.toRaw()
		};
	}
}
