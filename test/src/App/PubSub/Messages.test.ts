import { BlockReceived } from "../../../../src/App/PubSub/Messages/BlockReceived";
import { TokenDiscovered } from "../../../../src/App/PubSub/Messages/TokenDiscovered";
import { TxDiscovered } from "../../../../src/App/PubSub/Messages/TxDiscovered";
import { WalletDiscovered } from "../../../../src/App/PubSub/Messages/WalletDiscovered";
import { WalletSaved } from "../../../../src/App/PubSub/Messages/WalletSaved";
import { WalletUpdated } from "../../../../src/App/PubSub/Messages/WalletUpdated";
import { WalletTagName } from "../../../../src/App/Values/WalletTag";
import { BlockchainId } from "../../../../src/Config/Blockchains";
import { BaseMessage } from "../../../../src/Interfaces/IBroker";

type IgnoreTypeOfData = any;
describe("PubSub > Messages", () => {
	const blockReceivedMsg = new BlockReceived({
		block: { block: 1 } as IgnoreTypeOfData,
		blockchain: BlockchainId.Ethereum
	});
	const tokenDiscoveredMsg = new TokenDiscovered({
		address: "0xA",
		blockchain: BlockchainId.Ethereum
	});
	const txDiscoveredMsg = new TxDiscovered({
		blockchain: BlockchainId.Ethereum,
		hash: "0xHASH",
		saveUnknown: true,
		txRes: { txData: "mock" } as IgnoreTypeOfData,
		block: { blockData: "mock" } as IgnoreTypeOfData
	});
	const walletDiscoveredMsg = new WalletDiscovered({
		blockchain: BlockchainId.Ethereum,
		address: "0xAddress",
		tags: [WalletTagName.AddedManually],
		relations: []
	});
	const walletSavedMsg = new WalletSaved({
		address: "0xA",
		blockchain: BlockchainId.Ethereum
	});
	const walletUpdatedMsg = new WalletUpdated({
		address: "0xA",
		blockchain: BlockchainId.Ethereum
	});
	const messages: Array<[string, BaseMessage<any, any>]> = [
		["BlockReceived", blockReceivedMsg],
		["TokenDiscovered", tokenDiscoveredMsg],
		["TxDiscovered", txDiscoveredMsg],
		["WalletDiscovered", walletDiscoveredMsg],
		["WalletSaved", walletSavedMsg],
		["WalletUpdated", walletUpdatedMsg]
	];

	describe.each(messages)("%s", (txt, msg) => {
		it("should build the correct payload", () => {
			expect(msg.payload).toMatchSnapshot();
		});
		it("should get the channel with the blockchain prefix", () => {
			expect(msg.channel).toMatchSnapshot();
		});
	});
});
