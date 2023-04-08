import { ERC20 } from "./ERC20";
import { UniswapController } from "./Uniswap/V2/UniswapController";
import { UniswapFactory } from "./Uniswap/V2/UniswapFactory";
import { UniswapPair } from "./Uniswap/V2/UniswapPair";
import { UniswapRouter02 } from "./Uniswap/V2/UniswapRouter02";
import { Wrapped } from "./Wrapped";

export const ABI = {
	UniswapRouter02,
	UniswapFactory,
	UniswapController,
	UniswapPair,
	ERC20,
	Wrapped
};

export const allAbiList = Object.values(ABI);
