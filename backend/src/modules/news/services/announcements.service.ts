import { BaseService } from '@modules/common';
import { GetAnnouncementsDto } from '@modules/news';
import { getUtcNow } from '@utils';
import { Service } from 'typedi';

@Service()
export class AnnouncementsService extends BaseService {
  // public announcements = DbClient.getDbContext().announcements;

  public async get(): Promise<GetAnnouncementsDto> {
    const announcements: string[] = [
      'Przypominamy o obowiązkowej modlitwie Anioł Pański w intencji o otwartość na charyzmaty i ich przyjmowanie dla wszystkich członków wspólnoty przez ręce Maryi oraz zachęcie Pasterza do postu w intencji wspólnoty 12 dnia miesiąca.',
      'Posługa modlitwą wstawienniczą prowadzona w pierwszą i trzecią środę miesiąca w godz. od 17.00 do 18.00 w salce Miriam (główny budynek DD Tabor, poziom -1). Zapisy przez formularz na stronie internetowej www.miriam.rzeszow.pl',
    ];

    return await new Promise(resolve => {
      resolve(({
        announcements,
        date: getUtcNow(),
      } satisfies GetAnnouncementsDto));
    });
  }
}
