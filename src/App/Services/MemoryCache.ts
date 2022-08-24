import { injectable } from "inversify";
import NodeCache from "node-cache";
import { ICache } from "../Interfaces/ICache";

@injectable()
export class MemoryCache implements ICache {
	private cacheStorage = new NodeCache();
	private defaultTtlMilis = 60_000;

	async get<T>(key: string): Promise<T | undefined> {
		return this.cacheStorage.get(key);
	}

	async set<T>(
		key: string,
		value: T,
		ttlMilis = this.defaultTtlMilis
	): Promise<boolean> {
		return this.cacheStorage.set<T>(key, value, ttlMilis);
	}

	async has(key: string): Promise<boolean> {
		return this.cacheStorage.has(key);
	}

	async del(key: string) {
		return this.cacheStorage.del(key);
	}
}
