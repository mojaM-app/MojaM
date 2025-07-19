export interface BulletinDayTaskResponseDto {
  id: number;
  taskOrder: number;
  description: string;
  hasCommentField: boolean;
}

export interface BulletinDayResponseDto {
  id: number;
  dayNumber: number;
  introduction: string | null;
  instructions: string;
  tasks: BulletinDayTaskResponseDto[];
  actualDate: string;
}

export interface BulletinResponseDto {
  id: number;
  uuid: string;
  title: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  state: number;
  isPublished: boolean;
  isDraft: boolean;
  createdBy: number;
  modifiedBy: number | null;
  publishedBy: number | null;
  createdAt: string;
  modifiedAt: string;
  publishedAt: string | null;
  days: BulletinDayResponseDto[];
}

export interface BulletinListItemDto {
  id: number;
  uuid: string;
  title: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  state: number;
  isPublished: boolean;
  createdBy: number;
  createdAt: string;
  publishedAt: string | null;
}
