/* eslint-disable n/no-callback-literal */
import {
  NOTIFICATIONS_EMAIL,
  SMTP_SERVICE_HOST,
  SMTP_SERVICE_PORT,
  SMTP_USER_NAME,
  SMTP_USER_PASSWORD,
  TPL_VAR_RESET_PASSWORD_TITLE,
  TPL_VAR_RESET_PIN_TITLE,
  TPL_VAR_WELCOME_EMAIL_TITLE,
} from '@config';
import { AuthenticationTypes } from '@modules/auth';
import { toNumber } from '@utils';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';
import { Service } from 'typedi';
import { IResetPasscodeEmailSettings } from '../interfaces/reset-passcode-email-settings.interface';
import { IWelcomeEmailSettings } from '../interfaces/welcome-email-settings.interface';
import { TemplateVariablesHelper } from './template-variables.helper';

@Service()
export class EmailService {
  private readonly language: string = 'pl';

  public async sendWelcomeEmail(settings: IWelcomeEmailSettings): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      try {
        const templatePath = join(__dirname, `./../email.templates/welcomeEmail.${this.language}.handlebars`);

        const source = readFileSync(templatePath, 'utf8');

        const compiledTemplate = compile(source);

        const templateVariables = {
          ...TemplateVariablesHelper.get(),
          title: TPL_VAR_WELCOME_EMAIL_TITLE,
          link: settings.link,
          name: settings.user.getFirstLastNameOrEmail(),
        };

        const options = (): Mail.Options => {
          return {
            from: NOTIFICATIONS_EMAIL,
            to: settings.user.email,
            subject: TPL_VAR_WELCOME_EMAIL_TITLE,
            html: compiledTemplate(templateVariables),
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

  public async sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      try {
        let templatePath: string;
        let title: string;
        switch (settings.authType) {
          case AuthenticationTypes.Password:
            templatePath = join(__dirname, `./../email.templates/requestResetPassword.${this.language}.handlebars`);
            title = TPL_VAR_RESET_PASSWORD_TITLE!;
            break;
          case AuthenticationTypes.Pin:
            templatePath = join(__dirname, `./../email.templates/requestResetPin.${this.language}.handlebars`);
            title = TPL_VAR_RESET_PIN_TITLE!;
            break;
          default:
            throw new Error('Invalid authentication type');
        }

        const source = readFileSync(templatePath, 'utf8');

        const compiledTemplate = compile(source);

        const templateVariables = {
          ...TemplateVariablesHelper.get(),
          title,
          link: settings.link,
          name: settings.user.getFirstLastNameOrEmail(),
        };

        const options = (): Mail.Options => {
          return {
            from: NOTIFICATIONS_EMAIL,
            to: settings.user.email,
            subject: title,
            html: compiledTemplate(templateVariables),
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
