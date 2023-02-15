import { createBrokerAsPromised, VhostConfig } from "rascal";
import { sleep } from "../../../../App/Utils/Misc";
import { IConfig } from "../../../../Interfaces/IConfig";
import { Subscription } from "../../Subscription";
import { RoutingKey, Exchange, Queue, Publication } from "../Enums";
import { BindingSetup, PublicationSetup } from "./Types";

const RETRY_PREFIX = "retry_";
const DEAD_PREFIX = "dead_";

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
	[Publication.TxSaved, Exchange.Tx, RoutingKey.TxSaved],
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

const subscriptions: VhostConfig["subscriptions"] = {
	[Subscription.FindDirectTx]: {
		queue: Queue.FindDirectTx,
		prefetch: 10
	},
	[Subscription.FindInternalTx]: {
		queue: Queue.FindInternalTx
	},
	[Subscription.SaveTx]: {
		queue: Queue.SaveTx,
		prefetch: 20
	},
	[Subscription.SaveToken]: {
		queue: Queue.SaveToken
	},
	[Subscription.SaveWallet]: {
		queue: Queue.SaveWallet,
		prefetch: 20 // they generate too much txs. NOT NOW
	}
};

export const createBrokerConnection = async (config: IConfig) => {
	const bindings = bindingsSetup.map(
		([ex, routingKey, queue]) => `${ex}[${routingKey}] -> ${queue}`
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

	const publications = publicationsSetup.reduce(publicationsBuilder, {});

	// add retry/dead subs
	const deadAndRetrySubs: VhostConfig["subscriptions"] = Object.entries(
		subscriptions
	).reduce((_subs, [name, config]) => {
		const subs = {
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
	}, {});
	const subscriptionsWithRetries = { ...subscriptions, ...deadAndRetrySubs };
	// add retry/dead pubs
	Object.entries(deadAndRetrySubs).forEach(([sub, config]) => {
		publications[sub] = {
			queue: config.queue
		};
	});

	const vhostConfig: VhostConfig = {
		connections: getConnections(config.broker.config.uri),
		exchanges: Object.values(Exchange),
		queues,
		bindings,
		publications,
		subscriptions: subscriptionsWithRetries
	};
	const maxRetries = 120;
	let retry = 1;

	while (retry++) {
		try {
			const client = await createBrokerAsPromised({
				vhosts: {
					"/": vhostConfig
				}
			});
			return client;
		} catch (_error) {
			const error = _error as any;
			const notConnectionRefused =
				!error || !error.code || error.code !== "ECONNREFUSED";
			const maxRetriesReached = retry >= maxRetries;
			if (notConnectionRefused || maxRetriesReached) {
				throw error;
			}

			const nextRetry = 1000 + retry * 1000;
			return sleep(nextRetry);
		}
	}
};
type Pubs = Required<VhostConfig>["publications"];

function publicationsBuilder(
	pubs: Pubs,
	[publicationName, exchange, routingKey]: PublicationSetup
): Pubs {
	return {
		...pubs,
		[publicationName]: {
			exchange,
			routingKey
		}
	};
}

export function addRetryPrefix(name: string) {
	return `${RETRY_PREFIX}${name}`;
}
export function addDeadPrefix(name: string) {
	return `${DEAD_PREFIX}${name}`;
}
