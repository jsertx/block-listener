import { inject, injectable } from "inversify";
import {
	FeatureFlagStatus,
	IFeatureFlagService
} from "../../Interfaces/IFeatureFlagService";
import { IocKey } from "../../Ioc/IocKey";
import { ICache } from "../Interfaces/ICache";

const ffCacheKey = (flag: string) => `ff_${flag}`;

@injectable()
export class FeatureFlagService implements IFeatureFlagService {
	constructor(@inject(IocKey.Cache) private cache: ICache) {}
	async get(flag: string): Promise<FeatureFlagStatus> {
		const value = await this.cache.get<string>(ffCacheKey(flag));
		if (typeof value === "undefined") {
			return FeatureFlagStatus.Undefined;
		}
		if (value === FeatureFlagStatus.Enabled) {
			return FeatureFlagStatus.Enabled;
		}
		if (value === FeatureFlagStatus.Disabled) {
			return FeatureFlagStatus.Disabled;
		}
		return FeatureFlagStatus.Undefined;
	}

	async set(flag: string, value: FeatureFlagStatus): Promise<void> {
		await this.cache.set(ffCacheKey(flag), value);
	}
}
