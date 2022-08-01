export interface IApiResponse<Payload = any> {
	success: boolean;
	data: Payload;
}

export type IApiResponseEmpty = Omit<IApiResponse, "data">;

export interface IApiPaginatedResponse<Payload = any>
	extends IApiResponse<Array<Payload>> {
	total: number;
	page: number;
	pageSize: number;
}
