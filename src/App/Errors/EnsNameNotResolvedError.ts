export class EnsNameNotResolvedError extends Error {
	constructor(public blockchainId: string, public ens: string) {
		super(`The ENS "${ens}"@"${blockchainId}" could not be resolved.`);
	}
}
