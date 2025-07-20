import { BaseRepository } from '@db';
import { BadRequestException, errorKeys } from '@exceptions';
import { isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';
import { BulletinRepository } from '../repositories/bulletin.repository';

@Service()
export class BulletinPdfService extends BaseRepository {
  private readonly _bulletinRepository: BulletinRepository;

  constructor() {
    super();
    this._bulletinRepository = Container.get(BulletinRepository);
  }

  public async generatePdf(bulletinId: number, userId: number): Promise<Buffer> {
    if (isNullOrUndefined(bulletinId) || isNullOrUndefined(userId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletin = await this._bulletinRepository.get(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (!bulletin.isPublished) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    // Get bulletin days and tasks
    const days = await this._dbContext.bulletinDays.find({
      where: { bulletinId },
      order: { dayNumber: 'ASC' },
    });

    // Generate HTML template
    this.generateHtmlTemplate(bulletin, days);

    // For now, return a simple PDF placeholder
    // In a real implementation, you would use a library like puppeteer or similar
    const pdfBuffer = Buffer.from(`PDF content for bulletin: ${bulletin.title}`, 'utf-8');

    return pdfBuffer;
  }

  private generateHtmlTemplate(bulletin: any, days: any[]): string {
    return `
      <html>
        <head>
          <title>${bulletin.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            h2 { color: #666; margin-top: 30px; }
            .day { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .task { margin-left: 20px; margin-bottom: 15px; }
            .header { text-align: center; margin-bottom: 40px; }
            .date-range { color: #888; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${bulletin.title}</h1>
            <div class="date-range">
              Start Date: ${bulletin.startDate} | Days: ${bulletin.daysCount}
            </div>
          </div>

          ${days
            .map(
              day => `
            <div class="day">
              <h2>Day ${day.dayNumber}: ${day.introduction || 'Daily Tasks'}</h2>
              <p>${day.instructions}</p>
              <div class="tasks">
                <!-- Tasks would be loaded here -->
              </div>
            </div>
          `,
            )
            .join('')}
        </body>
      </html>
    `;
  }

  public async downloadPdf(bulletinId: number): Promise<{ success: boolean; data?: Buffer; message?: string }> {
    try {
      const bulletin = await this._bulletinRepository.get(bulletinId);
      if (!bulletin) {
        return { success: false, message: 'Bulletin not found' };
      }

      if (!bulletin.isPublished) {
        return { success: false, message: 'Bulletin not published' };
      }

      const pdfBuffer = await this.generatePdf(bulletinId, 0); // Use 0 for anonymous download
      return { success: true, data: pdfBuffer };
    } catch {
      return { success: false, message: 'Error generating PDF' };
    }
  }
}
