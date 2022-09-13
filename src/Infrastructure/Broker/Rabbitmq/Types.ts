export type Arguments = Record<string, any>;

export interface BackingQueueStatus {
	avg_ack_egress_rate: number;
	avg_ack_ingress_rate: number;
	avg_egress_rate: number;
	avg_ingress_rate: number;
	delta: any[];
	len: number;
	mode: string;
	next_deliver_seq_id: number;
	next_seq_id: number;
	q1: number;
	q2: number;
	q3: number;
	q4: number;
	target_ram_count: string;
	version: number;
}

export interface GarbageCollection {
	fullsweep_after: number;
	max_heap_size: number;
	min_bin_vheap_size: number;
	min_heap_size: number;
	minor_gcs: number;
}

export interface MessagesDetails {
	rate: number;
}

export interface MessagesReadyDetails {
	rate: number;
}

export interface MessagesUnacknowledgedDetails {
	rate: number;
}

export interface ReductionsDetails {
	rate: number;
}

export interface AckDetails {
	rate: number;
}

export interface DeliverDetails {
	rate: number;
}

export interface DeliverGetDetails {
	rate: number;
}

export interface DeliverNoAckDetails {
	rate: number;
}

export interface GetDetails {
	rate: number;
}

export interface GetEmptyDetails {
	rate: number;
}

export interface GetNoAckDetails {
	rate: number;
}

export interface PublishDetails {
	rate: number;
}

export interface RedeliverDetails {
	rate: number;
}

export interface MessageStats {
	ack: number;
	ack_details: AckDetails;
	deliver: number;
	deliver_details: DeliverDetails;
	deliver_get: number;
	deliver_get_details: DeliverGetDetails;
	deliver_no_ack: number;
	deliver_no_ack_details: DeliverNoAckDetails;
	get: number;
	get_details: GetDetails;
	get_empty: number;
	get_empty_details: GetEmptyDetails;
	get_no_ack: number;
	get_no_ack_details: GetNoAckDetails;
	publish: number;
	publish_details: PublishDetails;
	redeliver: number;
	redeliver_details: RedeliverDetails;
}

export interface IRabbitQueueData {
	arguments: Arguments;
	auto_delete: boolean;
	backing_queue_status: BackingQueueStatus;
	consumer_capacity: number;
	consumer_utilisation: number;
	consumers: number;
	durable: boolean;

	exclusive: boolean;
	exclusive_consumer_tag?: any;
	garbage_collection: GarbageCollection;
	head_message_timestamp?: any;
	idle_since: Date;
	memory: number;
	message_bytes: number;
	message_bytes_paged_out: number;
	message_bytes_persistent: number;
	message_bytes_ram: number;
	message_bytes_ready: number;
	message_bytes_unacknowledged: number;
	messages: number;
	messages_details: MessagesDetails;
	messages_paged_out: number;
	messages_persistent: number;
	messages_ram: number;
	messages_ready: number;
	messages_ready_details: MessagesReadyDetails;
	messages_ready_ram: number;
	messages_unacknowledged: number;
	messages_unacknowledged_details: MessagesUnacknowledgedDetails;
	messages_unacknowledged_ram: number;
	name: string;
	node: string;
	operator_policy?: any;
	policy?: any;
	recoverable_slaves?: any;
	reductions: any;
	reductions_details: ReductionsDetails;
	single_active_consumer_tag?: any;
	state: string;
	type: string;
	vhost: string;
	message_stats: MessageStats;
}

export type RabbitQueues = IRabbitQueueData[];
