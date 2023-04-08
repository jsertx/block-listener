import { ERC20 } from "./ERC20";
import { UniswapController } from "./Uniswap/V2/UniswapController";
import { UniswapFactory } from "./Uniswap/V2/UniswapFactory";
import { UniswapPair } from "./Uniswap/V2/UniswapPair";
import { UniswapRouter02 } from "./Uniswap/V2/UniswapRouter02";
import { UniswapV3Factory } from "./Uniswap/V3/UniswapV3Factory";
import { UniswapV3Pool } from "./Uniswap/V3/UniswapV3Pool";
import { UniswapV3Router } from "./Uniswap/V3/UniswapV3Router";
import { Wrapped } from "./Wrapped";

export const ABI = {
	UniswapRouter02,
	UniswapFactory,
	UniswapController,
	UniswapPair,
	ERC20,
	Wrapped,
	UniswapV3Factory,
	UniswapV3Pool,
	UniswapV3Router
};

export const allAbiList = Object.values(ABI);
