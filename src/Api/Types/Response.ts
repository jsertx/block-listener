export interface IApiResponse<Payload = any> {
  success: boolean;
  data: Payload;
}

export type IApiResponseEmpty = Omit<IApiResponse, "data">;
