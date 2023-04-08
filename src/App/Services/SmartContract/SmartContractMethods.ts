export enum UniswapV2RouterSwapMethods {
	swapETHForExactTokens = "swapETHForExactTokens",
	swapExactETHForTokens = "swapExactETHForTokens",
	swapExactTokensForETH = "swapExactTokensForETH",
	swapExactTokensForETHSupportingFeeOnTransferTokens = "swapExactTokensForETHSupportingFeeOnTransferTokens",
	swapExactETHForTokensSupportingFeeOnTransferTokens = "swapExactETHForTokensSupportingFeeOnTransferTokens",
	swapExactTokensForTokens = "swapExactTokensForTokens",
	swapExactTokensForTokensSupportingFeeOnTransferTokens = "swapExactTokensForTokensSupportingFeeOnTransferTokens",
	swapTokensForExactTokens = "swapTokensForExactTokens"
}

export enum UniswapV3RouterSwapMethods {
	exactInput = "exactInput",
	exactInputSingle = "exactInputSingle",
	exactOutput = "exactOutput",
	exactOutputSingle = "exactOutputSingle"
}

export enum ERC20TransferMethods {
	transferFrom = "transferFrom",
	transfer = "transfer"
}
