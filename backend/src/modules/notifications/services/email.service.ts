import {
  NOTIFICATIONS_EMAIL,
  SMTP_SERVICE_HOST,
  SMTP_SERVICE_PORT,
  SMTP_USER_NAME,
  SMTP_USER_PASSWORD,
  TPL_VAR_ACCOUNT_BLOCKED_EMAIL_TITLE,
  TPL_VAR_RESET_PASSWORD_TITLE,
  TPL_VAR_RESET_PIN_TITLE,
  TPL_VAR_WELCOME_EMAIL_TITLE,
} from '@config';
import { logger, AuthenticationTypes, IResetPasscodeEmailSettings, IWelcomeEmailSettings, IUnlockAccountEmailSettings } from '@core';
import { toNumber } from '@utils';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';
import { Service } from 'typedi';
import { TemplateVariablesHelper } from './template-variables.helper';

@Service()
export class EmailService {
  private readonly language: string = 'pl';

  public async sendWelcomeEmail(settings: IWelcomeEmailSettings): Promise<boolean> {
    const templatePath = join(__dirname, `./../email.templates/welcomeEmail.${this.language}.handlebars`);

    const templateVariables = {
      ...TemplateVariablesHelper.get(),
      title: TPL_VAR_WELCOME_EMAIL_TITLE,
      link: settings.link,
      name: settings.user.getFirstLastNameOrEmail(),
    };

    return await this.fillTemplateAndSendEmail(settings.user.email, templatePath, templateVariables);
  }

  public async sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean> {
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

    const templateVariables = {
      ...TemplateVariablesHelper.get(),
      title,
      link: settings.link,
      name: settings.user.getFirstLastNameOrEmail(),
    };

    return await this.fillTemplateAndSendEmail(settings.user.email, templatePath, templateVariables);
  }

  public async sendUnlockAccountEmail(settings: IUnlockAccountEmailSettings): Promise<boolean> {
    const templatePath = join(__dirname, `./../email.templates/unlockAccount.${this.language}.handlebars`);

    const templateVariables = {
      ...TemplateVariablesHelper.get(),
      title: TPL_VAR_ACCOUNT_BLOCKED_EMAIL_TITLE,
      link: settings.link,
      name: settings.user.getFirstLastNameOrEmail(),
      lockDateTime: `${settings.lockDateTime.toLocaleDateString(this.language)} ${settings.lockDateTime.toLocaleTimeString(this.language)}`,
    };

    return await this.fillTemplateAndSendEmail(settings.user.email, templatePath, templateVariables);
  }

  private async fillTemplateAndSendEmail(recipient: string, templatePath: string, templateVariables: Record<string, any>): Promise<boolean> {
    return await new Promise((resolve, _reject) => {
      try {
        const source = readFileSync(templatePath, 'utf8');

        const compiledTemplate = compile(source);

        const options = (): Mail.Options => {
          return {
            from: NOTIFICATIONS_EMAIL,
            to: recipient,
            subject: templateVariables.title,
            html: compiledTemplate(templateVariables),
          };
        };

        this.sendMail(options(), (success: boolean) => {
          resolve(success);
        });
      } catch (error) {
        logger.error('Error sending email', error);
        resolve(false);
      }
    });
  }

  private sendMail(mailOptions: Mail.Options, callback: (success: boolean) => void): void {
    const transporter = this.createTransporter();

    transporter.sendMail(mailOptions, (error, info) => {
      if (error !== null && error !== undefined) {
        logger.error('Error sending email', error);
        transporter.close();
        callback(false);
      } else {
        transporter.close();
        callback(true);
      }

      if (info !== null && info !== undefined) {
        logger.debug('Email sent', info);
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
