import { inject, injectable } from "inversify";
import { ILogger } from "../../Interfaces/ILogger";
import { IocKey } from "../../Ioc/IocKey";
import { IStandaloneApps } from "../Interfaces/IStandaloneApps";
import { IConfig } from "../../Interfaces/IConfig";
import { IPriceService } from "../Interfaces/IPriceService";
import { Axios } from "axios";
import { WebhookClient } from "discord.js";
import { CronSchedule } from "../Types/CronSchedule";
import Cron from "node-cron";

@injectable()
export class StatusNotifier implements IStandaloneApps {
	client = new Axios({
		baseURL: "http://localhost"
	});

	discord = new WebhookClient({
		url: this.config.discord.blockListenerStatusChannelHook
	});

	constructor(
		@inject(IocKey.Config)
		private config: IConfig,
		@inject(IocKey.Logger) private logger: ILogger,
		@inject(IocKey.PriceService) private priceService: IPriceService
	) {}

	async start() {
		Cron.schedule(
			CronSchedule.EveryTwelveHours,
			async () => await this.notify()
		);
	}

	private async notify() {
		try {
			const content = await this.client
				.get("/")
				.then((res) => res.data)
				.then(JSON.parse)
				.then(this.buildStatusMessageFromApi);
			await this.discord.send({
				content,
				username: "blocklistener-snitch",
				avatarURL: "https://i.imgur.com/dBAMyiR.jpeg"
			});
			this.logger.log({
				type: "notifications.discord.success",
				message: "Discord notification sent successfully"
			});
		} catch (_error) {
			const error: any = _error;
			this.logger.error({
				type: "notifications.discord.failure",
				message: error?.message || "Unknown error"
			});
		}
	}
	private buildStatusMessageFromApi(res: any) {
		const msg = Object.entries(res.data.latestBlocks).reduce(
			(msg, [chain, data]: [any, any]) => {
				msg += `\n[${chain.toUpperCase()}]`;
				msg += `\nHeight: ${data.height}`;
				msg += `\nDate: ${data.timestamp}`;
				msg += `\nLink: ${data.link}`;
				return msg;
			},
			"BlockListener Status:"
		);
		const statusMsg = Object.entries(res.data.broker).reduce(
			(msg, [queue, status]: [any, any]) => {
				if (status.dead === 0) {
					return msg;
				}
				return `${msg}\n${queue}: ${status.dead}`;
			},
			"Broker Dead Messages:"
		);

		return `${msg}\n\n${statusMsg}\n\n#blocklistener #status`;
	}
}
