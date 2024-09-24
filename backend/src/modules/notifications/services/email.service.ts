/* eslint-disable n/no-callback-literal */
import { NOTIFICATIONS_EMAIL, REQ_RESET_PASSWORD_TITLE, SMTP_SERVICE_HOST, SMTP_SERVICE_PORT, SMTP_USER_NAME, SMTP_USER_PASSWORD } from '@config';
import { IUserProfileDto } from '@modules/users';
import { toNumber } from '@utils';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';
import { Service } from 'typedi';

@Service()
export class EmailService {
  private readonly language: string = 'pl';

  public async sendEmailResetPassword(user: IUserProfileDto, link: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      try {
        const templatePath = join(__dirname, `./../email.templates/requestResetPassword.${this.language}.handlebars`);

        const source = readFileSync(templatePath, 'utf8');

        const compiledTemplate = compile(source);

        const payload = {
          link,
          name: user.firstName + ' ' + user.lastName,
        };

        const options = (): Mail.Options => {
          return {
            from: NOTIFICATIONS_EMAIL,
            to: user.email,
            subject: REQ_RESET_PASSWORD_TITLE,
            html: compiledTemplate(payload),
          };
        };

        this.sendEmail(options(), (success: boolean) => {
          resolve(success);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  private sendEmail(options: Mail.Options, callback: (success: boolean) => void): void {
    const transporter = this.createTransporter();

    transporter.sendMail(options, (error, info) => {
      if (error !== null && error !== undefined) {
        transporter.close();
        callback(false);
      } else {
        transporter.close();
        callback(true);
      }
    });
  }

  private createTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
    return nodemailer.createTransport({
      host: SMTP_SERVICE_HOST,
      port: toNumber(SMTP_SERVICE_PORT)!,
      auth: {
        user: SMTP_USER_NAME,
        pass: SMTP_USER_PASSWORD,
      },
    } satisfies SMTPConnection.Options);
  }
}