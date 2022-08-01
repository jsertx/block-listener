import { IApiPaginatedResponse } from "../Types/Response";
import { SetOptional } from "type-fest";

export const buildPaginatedResponse = <T = any>({
	success,
	data,
	total,
	page,
	pageSize
}: SetOptional<
	IApiPaginatedResponse<T>,
	"total" | "page" | "pageSize" | "success"
>): IApiPaginatedResponse<T> => ({
	success: typeof success === "undefined" ? true : success,
	total: total || data.length,
	page: page || 1,
	pageSize: pageSize || data.length,
	data
});
