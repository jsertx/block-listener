export class NotEvmChainError extends Error {
	constructor(public blockchainId: string) {
		super(
			`The blockchain "${blockchainId}" is not EVM so it does not has a chain id.`
		);
	}
}
