import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'vAnnouncement',
  expression: `
    SELECT
      a.id as id,
      a.title as title,
      a.content as content,
      a.created_at as createdAt,
      u.name as authorName
    FROM
      announcements a
    LEFT JOIN
      users u ON u.id = a.author_id
  `
})
export class VAnnouncement {
  @ViewColumn()
    id: number;

  @ViewColumn()
    title: string;

  @ViewColumn()
    content: string;

  @ViewColumn()
    createdAt: Date;

  @ViewColumn()
    authorName: string;
}
