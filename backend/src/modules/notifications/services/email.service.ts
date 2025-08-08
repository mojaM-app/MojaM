import { PathOrFileDescriptor, readFileSync } from 'fs';
import { compile } from 'handlebars';
import { default as nodemailer } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';
import { Container, Service } from 'typedi';
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
import {
  AuthenticationTypes,
  DatabaseLoggerService,
  ILogMetadata,
  IResetPasscodeEmailSettings,
  IUnlockAccountEmailSettings,
  IWelcomeEmailSettings,
} from '@core';
import { toNumber } from '@utils';
import { TemplateVariablesHelper } from './template-variables.helper';

@Service()
export class EmailService {
  private readonly _language: string = 'pl';
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  public async sendWelcomeEmail(settings: IWelcomeEmailSettings): Promise<boolean> {
    const templatePath = join(__dirname, `./../email.templates/welcomeEmail.${this._language}.handlebars`);

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
        templatePath = join(__dirname, `./../email.templates/requestResetPassword.${this._language}.handlebars`);
        title = TPL_VAR_RESET_PASSWORD_TITLE!;
        break;
      case AuthenticationTypes.Pin:
        templatePath = join(__dirname, `./../email.templates/requestResetPin.${this._language}.handlebars`);
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
    const templatePath = join(__dirname, `./../email.templates/unlockAccount.${this._language}.handlebars`);

    const templateVariables = {
      ...TemplateVariablesHelper.get(),
      title: TPL_VAR_ACCOUNT_BLOCKED_EMAIL_TITLE,
      link: settings.link,
      name: settings.user.getFirstLastNameOrEmail(),
      lockDateTime:
        `${settings.lockDateTime.toLocaleDateString(this._language)}` +
        ' ' +
        `${settings.lockDateTime.toLocaleTimeString(this._language)}`,
    };

    return await this.fillTemplateAndSendEmail(settings.user.email, templatePath, templateVariables);
  }

  private async fillTemplateAndSendEmail(
    recipient: string,
    templatePath: PathOrFileDescriptor,
    templateVariables: Record<string, any>,
  ): Promise<boolean> {
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
        this._databaseLoggerService.error('Error sending email', error);
        resolve(false);
      }
    });
  }

  private sendMail(mailOptions: Mail.Options, callback: (success: boolean) => void): void {
    const transporter = this.createTransporter();

    transporter.sendMail(mailOptions, (error: Error | null, info: SMTPTransport.SentMessageInfo | null) => {
      this._databaseLoggerService.debug('Email sent', {
        additionalData: this.getAdditionalData(mailOptions, info),
      } satisfies ILogMetadata);

      if (error !== null && error !== undefined) {
        this._databaseLoggerService.error('Error sending email', error);
        transporter.close();
        callback(false);
      } else {
        transporter.close();
        callback(true);
      }

      if (info !== null && info !== undefined) {
        this._databaseLoggerService.debug('Email sent', {
          additionalData: this.getAdditionalData(mailOptions, info),
        } satisfies ILogMetadata);
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

  private getAdditionalData(
    mailOptions: Mail.Options,
    info: SMTPTransport.SentMessageInfo | null,
  ): Record<string, any> {
    return {
      recipient: mailOptions.to,
      subject: mailOptions.subject,
      messageId: info?.messageId,
      response: info?.response,
      accepted: info?.accepted,
      rejected: info?.rejected,
      pending: info?.pending,
      envelope: info?.envelope ? info.envelope.toString() : undefined,
    };
  }
}
