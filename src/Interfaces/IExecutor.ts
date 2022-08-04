export interface IExecutor {
	start(): void;
	startDeadRecovery(): void;
	startRetryManager(): void;
}
