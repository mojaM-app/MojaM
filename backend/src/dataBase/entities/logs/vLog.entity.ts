import { ViewColumn, ViewEntity } from 'typeorm';
import { EntityTransformFunctions } from './../../EntityTransformFunctions';

@ViewEntity({
  name: 'vLogs',
  expression: `
    SELECT
      l.Id,
      l.Level,
      l.Message,
      l.Source,
      l.IpAddress,
      l.UserAgent,
      l.Path,
      l.Method,
      l.RequestId,
      l.UserId,
      l.Severity,
      l.IsSecurityEvent,
      l.CreatedAt,
      u.Email as UserEmail,
      CONCAT(u.FirstName, ' ', u.LastName) as UserFullName
    FROM logs l
    LEFT JOIN users u ON l.UserId = u.Uuid
  `,
})
export class vLog {
  @ViewColumn({ name: 'Id' })
  public id!: number;

  @ViewColumn({ name: 'Level' })
  public level!: string;

  @ViewColumn({ name: 'Message' })
  public message!: string;

  @ViewColumn({ name: 'Source' })
  public source?: string;

  @ViewColumn({ name: 'IpAddress' })
  public ipAddress?: string;

  @ViewColumn({ name: 'UserAgent' })
  public userAgent?: string;

  @ViewColumn({ name: 'Path' })
  public path?: string;

  @ViewColumn({ name: 'Method' })
  public method?: string;

  @ViewColumn({ name: 'RequestId' })
  public requestId?: string;

  @ViewColumn({ name: 'UserId' })
  public userId?: string;

  @ViewColumn({ name: 'Severity' })
  public severity?: string;

  @ViewColumn({
    name: 'IsSecurityEvent',
    transformer: {
      from: EntityTransformFunctions.anyToBoolean,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public isSecurityEvent!: boolean;

  @ViewColumn({ name: 'CreatedAt' })
  public createdAt!: Date;
}
