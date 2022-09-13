import { TestingExecutor } from "./TestingExecutor";
import { createLoggerMock } from "../../../../mocks/Logger.mock";
import { createBrokerMock } from "../../../../mocks/Broker.mock";
import { ExecutorMessage } from "../../../../../src/Infrastructure/Broker/Executor";

describe("Infrastructure >  Executor", () => {
	let executor: TestingExecutor;
	const channel = "testing_channel";
	const deadChannel = "dead_testing_channel";
	const retryChannel = "retry_testing_channel";

	const executeMock = jest.fn();
	const brokerMock = createBrokerMock();
	const loggerMock = createLoggerMock();

	beforeEach(() => {
		jest.resetAllMocks();
		executor = new TestingExecutor(
			executeMock,
			loggerMock,
			brokerMock,
			channel
		);
	});
	describe("Getters", () => {
		it("should return retry channel", () => {
			expect(executor.retryChannel).toBe(retryChannel);
		});
		it("should return dead channel", () => {
			expect(executor.deadChannel).toBe(deadChannel);
		});
	});

	describe("Happy Path", () => {
		beforeEach(async () => {
			await executor.start();
		});

		it("should subscribe to channel", () => {
			expect(brokerMock.subscribe).toHaveBeenCalledTimes(1);
			const subscribedChannel = brokerMock.subscribe.mock.calls[0][0];
			expect(subscribedChannel).toBe(channel);
		});

		it("should log data", () => {
			expect(loggerMock.log).toHaveBeenCalledTimes(1);
			const logEntry = loggerMock.log.mock.calls[0][0];
			expect(logEntry).toMatchObject({ type: "executor.start" });
		});

		it("should call execute method on new message", async () => {
			const listener = brokerMock.subscribe.mock.calls[0][1];
			const ackMock = jest.fn();
			const nackMock = jest.fn();
			const msg = { message: "Hello" };
			await listener(msg, ackMock, nackMock);

			expect(executeMock).toHaveBeenCalledTimes(1);
			expect(ackMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Sad Path", () => {
		const error = new Error("I dont want to work");
		beforeEach(async () => {
			executeMock.mockRejectedValue(error);
			await executor.start();
		});

		it("should call execute method on new message", async () => {
			const listener = brokerMock.subscribe.mock.calls[0][1];
			const ackMock = jest.fn();
			const nackMock = jest.fn();
			const msg = new ExecutorMessage(channel, { message: "Hello" });
			await listener(msg, ackMock, nackMock);

			expect(brokerMock.publish).toHaveBeenCalledTimes(1);
			const retryMsg = brokerMock.publish.mock.calls[0][0];
			expect(retryMsg.channel).toBe(retryChannel);
			expect(ackMock).toHaveBeenCalledTimes(1);
		});
	});
});
