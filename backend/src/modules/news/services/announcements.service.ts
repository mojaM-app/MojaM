import { Service } from 'typedi';
import { GetAnnouncementsDto } from '@modules/news/dtos/announcements.dto';
import { toUtcDate } from '@utils/date.utils';

@Service()
export class AnnouncementsService {
  // public announcements = new PrismaClient().announcements;

  public async get(): Promise<GetAnnouncementsDto> {
    const announcements = [
      'Przypominamy o obowiązkowej modlitwie Anioł Pański w intencji o otwartość na charyzmaty i ich przyjmowanie dla wszystkich członków wspólnoty przez ręce Maryi oraz zachęcie Pasterza do postu w intencji wspólnoty 12 dnia miesiąca.',
      'Posługa modlitwą wstawienniczą prowadzona w pierwszą i trzecią środę miesiąca w godz. od 17.00 do 18.00 w salce Miriam (główny budynek DD Tabor, poziom -1). Zapisy przez formularz na stronie internetowej www.miriam.rzeszow.pl',
    ];

    return new Promise(resolve => {
      resolve(<GetAnnouncementsDto>{
        announcements: announcements,
        date: toUtcDate(new Date()),
      });
    });
  }
}
