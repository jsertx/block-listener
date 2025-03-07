import { describe, expect } from "@jest/globals";
import {
	AddressRelationType,
	Wallet
} from "../../../../../src/App/Entities/Wallet";
import { TxDiscovered } from "../../../../../src/App/PubSub/Messages/TxDiscovered";
import { WalletSaved } from "../../../../../src/App/PubSub/Messages/WalletSaved";
import { WalletUpdated } from "../../../../../src/App/PubSub/Messages/WalletUpdated";
import { SaveWallet } from "../../../../../src/App/UseCases/Wallets/SaveWallet";
import { WalletTagName } from "../../../../../src/App/Values/WalletTag";
import { WalletType } from "../../../../../src/App/Values/WalletType";
import { BlockchainId } from "../../../../../src/Config/Blockchains";
import { createBlockchainServiceMock } from "../../../../mocks/BlockchainService.mock";
import { createBrokerMock } from "../../../../mocks/Broker.mock";
import { createLoggerMock } from "../../../../mocks/Logger.mock";
import { createWalletRepositoryMock } from "../../../../mocks/WalletRepository.mock";

describe("UseCase > SaveWallet", () => {
	let useCase: SaveWallet;
	const address = "0xb6bb85755521b7ee295c48250cc73bff94fac4f6";
	const address2 = "0xa36c420012725ff00af7e0ca62b73a095e7942ae";
	const walletRepositoryMock = createWalletRepositoryMock();
	const blockchainServiceMock = createBlockchainServiceMock();
	const loggerMock = createLoggerMock();
	const brokerMock = createBrokerMock();

	beforeEach(() => {
		jest.resetAllMocks();
		useCase = new SaveWallet(
			walletRepositoryMock,
			blockchainServiceMock,
			brokerMock,
			loggerMock
		);
	});

	describe.each([
		[WalletType.Whale, true],
		[WalletType.UnknownWallet, false],
		[WalletType.ExchangeWallet, false]
	])("New wallet", (walletType, shouldSaveWalletTxs) => {
		const txs = [
			"0x292af104617f967b55f43e90afbd070f7d0cd8a3e80c59af3fe219207d4c4456",
			"0xf3023f2df436b81632bf399f9639b80e63d52b349c462e5600ee08f501e69db3"
		];
		const blockchain = BlockchainId.Ethereum;

		describe("Save wallet with txs", () => {
			beforeEach(async () => {
				walletRepositoryMock.findOne.mockResolvedValue(undefined);
				blockchainServiceMock.getWalletTxsHashes.mockResolvedValue(txs);
				await useCase.execute({
					type: walletType,
					address,
					blockchain,
					tags: [WalletTagName.FoundIteratingBlocks]
				});
			});

			it(`should call ${
				shouldSaveWalletTxs ? "" : "not"
			} blockchainService to get txs`, async () => {
				expect(
					blockchainServiceMock.getWalletTxsHashes
				).toHaveBeenCalledTimes(shouldSaveWalletTxs ? 1 : 0);
				if (shouldSaveWalletTxs) {
					expect(
						blockchainServiceMock.getWalletTxsHashes
					).toHaveBeenCalledWith(blockchain, address);
				}
			});
			describe("should publish events", () => {
				it(`should ${
					shouldSaveWalletTxs ? "" : "not"
				} publish tx_discovered event`, () => {
					txs.forEach((hash) => {
						let expectSubject: any = expect(brokerMock.publish);
						if (!shouldSaveWalletTxs) {
							expectSubject = expectSubject.not;
						}
						expectSubject.toHaveBeenCalledWith(
							new TxDiscovered({
								hash,
								blockchain,
								saveUnknown: true
							})
						);
					});
				});

				it("should publish wallet_saved event", () => {
					expect(brokerMock.publish).toHaveBeenCalledWith(
						new WalletSaved({
							address,
							blockchain
						})
					);
				});
			});

			it("should save wallet on the repo", () => {
				expect(walletRepositoryMock.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("Update existing wallet", () => {
		const blockchain = BlockchainId.Ethereum;
		let existingWallet: Wallet;
		beforeEach(() => {
			existingWallet = new Wallet({
				address,
				blockchain,
				createdAt: new Date(),
				tags: [
					{
						createdAt: new Date(),
						tag: WalletTagName.FoundByIncomingTransfer
					}
				],
				type: WalletType.UnknownWallet,
				relations: [
					{
						address: address2,
						createdAt: new Date(),
						type: AddressRelationType.TransferReceived
					}
				]
			});
		});

		describe("Happy path", () => {
			beforeEach(async () => {
				walletRepositoryMock.findOne.mockResolvedValueOnce(
					existingWallet
				);
				await useCase.execute({
					address,
					blockchain,
					type: WalletType.Whale,
					tags: [WalletTagName.FoundIteratingBlocks],
					relations: [
						{
							address: address2,
							type: AddressRelationType.TransferSent
						}
					]
				});
			});

			describe("should save wallet", () => {
				let savedWallet: Wallet;
				beforeEach(() => {
					savedWallet = walletRepositoryMock.save.mock.calls[0][0];
				});
				it("should call repository save method", () => {
					expect(walletRepositoryMock.save).toHaveBeenCalledTimes(1);
				});
				it("should add new tags", () => {
					expect(savedWallet.tags).toHaveLength(2);
				});
				it("should add new relationships", () => {
					expect(savedWallet.relations).toHaveLength(2);
				});
				// TODO
				// it("should change unknown wallet to whale", () => {
				// 	expect(savedWallet.type).toBe(WalletType.Whale);
				// });
			});

			it("should publish wallet_updated event", () => {
				expect(brokerMock.publish).toHaveBeenCalledWith(
					new WalletUpdated({
						address,
						blockchain
					})
				);
			});
		});
	});
});
