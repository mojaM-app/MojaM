export interface IBulletinDay {
  id: string;
  // content: string;
  // createdAt: Date;
  // createdBy: string | null;
  // updatedAt?: Date;
  // updatedBy?: string | null;

  // getAuthorName(): string;
  // getCreationDateTime(): Date;
}

export interface IBulletin {
  id: string;
  title?: string | null;
  startDate?: Date | null;
  //state: number;
  // createdAt: Date;
  // createdBy: string | null;
  // updatedAt: Date;
  // publishedAt?: Date | null;
  // publishedBy?: string | null;
  days: IBulletinDay[];
  // getPublisherName(): string;
  // getPublishDateTime(): Date | undefined | null;
}
