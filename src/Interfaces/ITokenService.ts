import { Token } from "../App/Entities/Token";
import { BlockchainId } from "../App/Values/Blockchain";

export interface ITokenService {
	getWrappedToken(blockchain: BlockchainId): Promise<Token>;
	getStableCoins(blockchain: BlockchainId): Promise<Token[]>;
}
