import { inject, injectable } from "inversify";
import NodeCache from "node-cache";
import { ILogger } from "../../../Interfaces/ILogger";
import { IocKey } from "../../../Ioc/IocKey";
import { ICache } from "../../Interfaces/ICache";

@injectable()
export class MemoryCache implements ICache {
	private cacheStorage = new NodeCache();
	private defaultTtlSecs = 120;
	constructor(@inject(IocKey.Logger) private logger: ILogger) {}

	async get<T>(key: string): Promise<T | undefined> {
		const value = this.cacheStorage.get<T>(key);
		if (this.cacheStorage.has(key)) {
			this.logger.log({
				type: `cache.hit.${key}`,
				message: `Cache hit for key ${key}`
			});
		} else {
			this.logger.log({
				type: `cache.miss.${key}`,
				message: `Cache miss for key ${key}`
			});
		}
		return value;
	}

	async set<T>(
		key: string,
		value: T,
		ttlSecs = this.defaultTtlSecs
	): Promise<boolean> {
		return this.cacheStorage.set<T>(key, value, ttlSecs);
	}

	async has(key: string): Promise<boolean> {
		return this.cacheStorage.has(key);
	}

	async del(key: string) {
		return this.cacheStorage.del(key);
	}
}
