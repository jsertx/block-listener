export interface ICache {
	get<T>(key: string): Promise<T | undefined>;
	set<T>(key: string, value: T, ttlMilis?: number): Promise<boolean>;
	has(key: string): Promise<boolean>;
	del(key: string): void;
}
