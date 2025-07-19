export interface UserBulletinProgressResponseDto {
  id: number;
  bulletinId: number;
  dayNumber: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  actualDate: string;
}

export interface UserTaskProgressResponseDto {
  id: number;
  taskId: number;
  isCompleted: boolean;
  comment: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface UserBulletinCalendarDayDto {
  date: string;
  bulletinId: number | null;
  bulletinTitle: string | null;
  dayNumber: number | null;
  isCompleted: boolean;
  hasQuestions: boolean;
}

export interface UserBulletinCalendarResponseDto {
  days: UserBulletinCalendarDayDto[];
  activeBulletins: BulletinCalendarSummaryDto[];
}

export interface BulletinCalendarSummaryDto {
  id: number;
  uuid: string;
  title: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
}
