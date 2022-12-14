export enum CronSchedule {
	EveryMinute = "* * * * *",
	EveryHour = "0 * * * *",
	EveryDay = "0 0 * * *",
	EveryTwelveHours = "0 */12 * * *"
}
