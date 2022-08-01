import { IBroker } from "../../Interfaces/IBroker";
import { Subscription } from "../../Infrastructure/Broker/Subscription";

export type IAppBroker = IBroker<string, Subscription>;
