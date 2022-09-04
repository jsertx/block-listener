export enum FeatureFlagStatus {
	Enabled = "1",
	Disabled = "0",
	Undefined = "U"
}
export interface IFeatureFlagService {
	get(flag: string, defaultValue?: boolean): Promise<FeatureFlagStatus>;
	set(flag: string, value: FeatureFlagStatus): Promise<void>;
}
