import { createBrokerAsPromised, VhostConfig } from "rascal";
import { IConfig } from "../../../../Interfaces/IConfig";
import { Publication } from "../../Publication";
import { Subscription } from "../../Subscription";
import { RoutingKey, Exchange, Queue } from "../Enums";
import { BindingSetup, PublicationSetup } from "./Types";

const getConnections = (brokerUrl: string): VhostConfig["connections"] => {
	return [
		{
			url: brokerUrl,
			options: {
				heartbeat: 100,
				timeout: 100_000
			},
			socketOptions: {
				timeout: 100_000
			}
		}
	];
};

const publicationsSetup: PublicationSetup[] = [
	[Publication.BlockReceived, Exchange.Block, RoutingKey.BlockReceived],
	[Publication.TxDiscovered, Exchange.Tx, RoutingKey.TxDiscovered],
	[Publication.TokenDiscovered, Exchange.Token, RoutingKey.TokenDiscovered],
	[
		Publication.WalletDiscovered,
		Exchange.Wallet,
		RoutingKey.WalletDiscovered
	],
	[Publication.WalletSaved, Exchange.Wallet, RoutingKey.WalletSaved],
	[Publication.WalletUpdated, Exchange.Wallet, RoutingKey.WalletUpdated]
];

const bindingsSetup: BindingSetup[] = [
	[Exchange.Block, RoutingKey.BlockReceived, Queue.FindDirectTx],
	// Not needed yet [Exchange.Block, RoutingKey.BlockReceived, Queue.FindInternalTx],
	[Exchange.Tx, RoutingKey.TxDiscovered, Queue.SaveTx],
	[Exchange.Token, RoutingKey.TokenDiscovered, Queue.SaveToken],
	[Exchange.Wallet, RoutingKey.WalletDiscovered, Queue.SaveWallet]
];

export const createBrokerConnection = async (config: IConfig) => {
	const bindings = bindingsSetup.reduce(
		expandBindingsByBlockchain(config.enabledBlockchains),
		[]
	);
	const queues = Object.values(Queue).reduce<string[]>(
		(queues, name) => [
			...queues,
			name,
			addRetryPrefix(name),
			addDeadPrefix(name)
		],
		[]
	);
	let subscriptions: VhostConfig["subscriptions"] = {
		[Subscription.FindDirectTx]: {
			queue: Queue.FindDirectTx,
			prefetch: 30
		},
		[Subscription.FindInternalTx]: {
			queue: Queue.FindInternalTx
		},
		[Subscription.SaveTx]: {
			queue: Queue.SaveTx,
			prefetch: 50
		},
		[Subscription.SaveToken]: {
			queue: Queue.SaveToken
		},
		[Subscription.SaveWallet]: {
			queue: Queue.SaveWallet
		}
	};

	const publications = publicationsSetup.reduce(
		expandPublicationsByBlockchain(config.enabledBlockchains),
		{}
	);
	// add retry/dead subs
	subscriptions = Object.entries(subscriptions).reduce(
		(_subs, [name, config]) => {
			const subs = {
				[name]: config,
				..._subs
			};

			if (config.queue) {
				return {
					...subs,
					[addRetryPrefix(name)]: {
						queue: addRetryPrefix(config.queue)
					},
					[addDeadPrefix(name)]: {
						queue: addDeadPrefix(config.queue)
					}
				};
			}
			return subs;
		},
		{}
	);
	// add retry/dead pubs
	Object.entries(subscriptions).forEach(([sub, config]) => {
		if (!config.queue) {
			return;
		}
		publications[sub] = {
			queue: config.queue
		};
	});

	const vhostConfig: VhostConfig = {
		connections: getConnections(config.broker.brokerUri),
		exchanges: Object.values(Exchange),
		queues,
		bindings,
		publications,
		subscriptions
	};
	const maxRetries = 120;
	let retry = 1;
	while (retry++) {
		const client = await createBrokerAsPromised({
			vhosts: {
				"/": vhostConfig
			}
		}).catch((error) => {
			if (!error || !error.code || error.code !== "ECONNREFUSED") {
				throw error;
			}
			return new Promise((resolve, reject) => {
				if (retry >= maxRetries) {
					reject(error);
					return;
				}
				const nextRetry = 1000 + retry * 1000;
				setTimeout(resolve, nextRetry);
			});
		});
		if (client) {
			return client;
		}
	}
};

function expandBindingsByBlockchain(blockchains: string[]) {
	return (
		bindings: string[],
		[ex, routingKeyCreator, queue]: BindingSetup
	): string[] => {
		const expandedBindings = blockchains.map(
			(blockchain) =>
				`${ex}[${routingKeyCreator(blockchain)}] -> ${queue}`
		);
		return [...bindings, ...expandedBindings];
	};
}
type Pubs = Required<VhostConfig>["publications"];

function expandPublicationsByBlockchain(blockchains: string[]) {
	return (
		pubs: Pubs,
		[publicationCreator, exchange, routingKeyCreator]: PublicationSetup
	): Pubs => {
		const newPubs: Pubs = blockchains.reduce((pubs, blockchain) => {
			return {
				...pubs,
				[publicationCreator(blockchain)]: {
					exchange,
					routingKey: routingKeyCreator(blockchain),
					timeout: 100_000
				}
			};
		}, {} as Pubs);

		return { ...pubs, ...newPubs };
	};
}

export function addRetryPrefix(name: string) {
	return `retry_${name}`;
}
export function addDeadPrefix(name: string) {
	return `dead_${name}`;
}
