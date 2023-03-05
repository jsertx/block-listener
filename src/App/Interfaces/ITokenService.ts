import { Token } from "../Entities/Token";
import { BlockchainId } from "../Values/Blockchain";

export interface TokenWithPriceData {
	token: Token;
	nativePrice: string;
}

export interface ITokenService {
	getWrappedToken(blockchain: BlockchainId): Promise<Token>;
	getStableCoins(blockchain: BlockchainId): Promise<Token[]>;
	fetchTokenDataWithPrice(
		blockchain: BlockchainId,
		tokenAddr: string
	): Promise<TokenWithPriceData>;
	fetchTokensData(
		blockchain: BlockchainId,
		tokenAddrs: string[]
	): Promise<Token[]>;
}
