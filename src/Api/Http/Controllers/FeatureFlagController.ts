import { inject } from "inversify";
import {
	interfaces,
	controller,
	httpPost,
	requestParam
} from "inversify-express-utils";
import {
	FeatureFlagStatus,
	IFeatureFlagService
} from "../../../Interfaces/IFeatureFlagService";
import { IocKey } from "../../../Ioc/IocKey";
import { IApiResponseEmpty } from "../Types/Response";

@controller("/ff")
export class FeatureFlagController implements interfaces.Controller {
	constructor(
		@inject(IocKey.FeatureFlagService)
		private featureFlagService: IFeatureFlagService
	) {}

	@httpPost("set/:name/:enable")
	async setFeatureFlag(
		@requestParam("name") name: string,
		@requestParam("enable") enable: string
	): Promise<IApiResponseEmpty> {
		const value =
			enable === "1"
				? FeatureFlagStatus.Enabled
				: FeatureFlagStatus.Disabled;
		await this.featureFlagService.set(name, value);
		return { success: true };
	}
}
