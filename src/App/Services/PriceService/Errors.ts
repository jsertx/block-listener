export class GetPriceError extends Error {
	constructor(symbol: string, timestamp: number) {
		super(`[PriceService] Error getting price for ${symbol}@${timestamp}`);
	}
}
