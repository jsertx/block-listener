import redis, { RedisClient, RetryStrategyOptions } from "redis";

import { inject, injectable } from "inversify";
import { promisify } from "util";

import { ICache } from "../../Interfaces/ICache";
import { IocKey } from "../../../Ioc/IocKey";
import { ILogger } from "../../../Interfaces/ILogger";
import { IConfig } from "../../../Interfaces/IConfig";

const MAX_TTL_SECS = 60 * 24 * 30;
const MAX_CONN_RETRY_DELAY_SECS = 60;

@injectable()
export class RedisCache implements ICache {
	private client: RedisClient;
	private defaultTtlSecs = 120;
	constructor(
		@inject(IocKey.Config) private config: IConfig,
		@inject(IocKey.Logger) private logger: ILogger
	) {
		this.client = redis.createClient({
			url: this.config.redis.url,
			retry_strategy: this.retryStrategy.bind(this)
		});
		this.client.on("connect", () => {
			this.logger.log({
				type: "redis.connected",
				message: "Redis connected"
			});
		});
		this.client.on("error", this.errorHandler.bind(this));
	}

	async get<T>(key: string): Promise<T | undefined> {
		try {
			const rawValue = await promisify(this.client.get).bind(this.client)(
				key
			);
			if (!rawValue) {
				return undefined;
			}
			return this.deserialize(rawValue) as T;
		} catch (error) {
			this.logger.error({
				type: "redis.get",
				message: "Error getting value from cache",
				error
			});

			return undefined;
		}
	}

	async set<T>(
		key: string,
		value: T,
		ttlSeconds = this.defaultTtlSecs
	): Promise<boolean> {
		let serializedValue: string;
		try {
			serializedValue = this.serialize(value);
		} catch (error) {
			this.logger.error({
				type: "redis.set.serialize",
				message: "Error serializing value value from cache",
				error
			});

			return false;
		}

		if (ttlSeconds === 0) {
			ttlSeconds = MAX_TTL_SECS;
		}

		return new Promise((resolve) => {
			this.client.set(
				key,
				serializedValue,
				"EX",
				ttlSeconds,
				(error, _value) => {
					if (error) {
						this.logger.error({
							type: "redis.set",
							message: "Error setting value from cache",
							error
						});

						return resolve(false);
					}
					resolve(true);
				}
			);
		});
	}

	del(key: string): void {
		this.client.del(key);
	}

	has(key: string): Promise<boolean> {
		return new Promise((resolve) => {
			this.client.exists(key, (error, reply) => {
				if (error) {
					this.logger.error({
						type: "redis.has",
						message: "Error finding value in cache",
						error
					});

					return resolve(false);
				}
				resolve(reply === 1);
			});
		});
	}

	private serialize(value: any) {
		return JSON.stringify(value);
	}

	private deserialize(rawValue: string) {
		try {
			return JSON.parse(rawValue);
		} catch (error) {
			return rawValue;
		}
	}

	private errorHandler(error: any) {
		this.logger.error({
			type: "redis.connection",
			message: "Redis connection failed",
			error
		});
	}

	private retryStrategy({ attempt }: RetryStrategyOptions) {
		const initialBackoffInSeconds = 1;
		const backoffFactor = 2;
		const nextAttemptInSeconds = Math.min(
			Math.pow(backoffFactor, attempt) * initialBackoffInSeconds,
			MAX_CONN_RETRY_DELAY_SECS
		);
		this.logger.warn({
			type: "redis.connection.retry",
			message:
				"Attempt #${attempt}. Next attempt in ${nextAttemptInSeconds} seconds",
			error: null
		});

		return nextAttemptInSeconds * 1000;
	}
}
