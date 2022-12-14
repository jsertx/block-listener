export interface DeadRecoveryOptions {
	amount?: number;
}
export interface IExecutor {
	start(): void;
	startDeadRecovery(options?: DeadRecoveryOptions): void;
	startRetryManager(): void;
}
