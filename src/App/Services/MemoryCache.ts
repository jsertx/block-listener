import { inject, injectable } from "inversify";
import NodeCache from "node-cache";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { ICache } from "../Interfaces/ICache";

@injectable()
export class MemoryCache implements ICache {
	private cacheStorage = new NodeCache();
	private defaultTtlMilis = 60_000;
	constructor(@inject(IocKey.Logger) private logger: ILogger) {}

	async get<T>(key: string): Promise<T | undefined> {
		const value = this.cacheStorage.get<T>(key);
		if (this.cacheStorage.has(key)) {
			this.logger.debug({
				type: `cache.hit.${key}`,
				message: `Cache hit for key ${key}`
			});
		} else {
			this.logger.debug({
				type: `cache.miss.${key}`,
				message: `Cache miss for key ${key}`
			});
		}
		return value;
	}

	async set<T>(
		key: string,
		value: T,
		ttlMilis = this.defaultTtlMilis
	): Promise<boolean> {
		return this.cacheStorage.set<T>(key, value, ttlMilis / 1000);
	}

	async has(key: string): Promise<boolean> {
		return this.cacheStorage.has(key);
	}

	async del(key: string) {
		return this.cacheStorage.del(key);
	}
}
