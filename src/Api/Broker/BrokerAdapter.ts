import { inject, injectable } from "inversify";
import { IAdapter } from "../../Interfaces/IAdapter";

@injectable()
export class BrokerAdapter implements IAdapter {
	constructor() {}

	start() {}
}
