import { Token } from "../Entities/Token";
import { BlockchainId } from "../Values/Blockchain";

export interface ITokenService {
	getWrappedToken(blockchain: BlockchainId): Promise<Token>;
	getStableCoins(blockchain: BlockchainId): Promise<Token[]>;
}
