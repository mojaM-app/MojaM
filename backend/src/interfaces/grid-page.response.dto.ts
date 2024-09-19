export interface IPageData {
  pageIndex: number;
  pageSize: number;
}

export interface ISortData {
  column: string;
  direction: 'asc' | 'desc' | string;
}

export interface IGridPageResponseDto<T> {
  items: T[];
  totalCount: number;
}
