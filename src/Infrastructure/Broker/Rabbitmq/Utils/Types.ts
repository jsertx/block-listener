import { Exchange, Queue, RoutingKey, Publication } from "../Enums";

export type BindingSetup = [Exchange, RoutingKey, Queue];

export type PublicationSetup = [Publication, Exchange, RoutingKey];
