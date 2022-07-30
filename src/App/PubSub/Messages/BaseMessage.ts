export abstract class BaseMessage<Payload> {
  constructor(
    public readonly channel: string,
    public readonly payload: Payload
  ) {}
}
