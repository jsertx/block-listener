export class Entity<Props> {
  constructor(protected props: Props, protected _id?: string) {}

  get id(): string | undefined {
    return this._id;
  }

  get isSaved() {
    return !!this.id;
  }

  toRaw(): Props {
    return this.props;
  }
}
