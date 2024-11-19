export interface IResponse<TResponseResult> {
  data: TResponseResult;
  message?: string;
}

export interface IResponseError {
  message: string;
  args?: Record<string, unknown>;
}
