import { IBroker } from "../../Interfaces/IBroker";
import { Subscription } from "../../Infrastructure/Broker/Subscription";

export interface IAppBroker extends IBroker<string, Subscription> {}
