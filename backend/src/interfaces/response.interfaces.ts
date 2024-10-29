export interface IResponse<TResponseResult> {
  data: TResponseResult;
  message?: string;
}

export interface IResponseError {
  message: string;
  args?: Array<string | number | Date>;
}
