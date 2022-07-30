import { PublicationCreator } from "../../Publication";
import { Exchange, Queue, RoutingKeyCreator } from "../Enums";

export type BindingSetup = [Exchange, RoutingKeyCreator, Queue];
export type PublicationSetup = [
  PublicationCreator,
  Exchange,
  RoutingKeyCreator
];
