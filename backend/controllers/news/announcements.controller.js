import dateUtils from "../../utils/date.utils.js";

const getAnnouncements = (req, res) => {
    const announcements = [
        "Przypominamy o obowiązkowej modlitwie Anioł Pański w intencji o otwartość na charyzmaty i ich przyjmowanie dla wszystkich członków wspólnoty przez ręce Maryi oraz zachęcie Pasterza do postu w intencji wspólnoty 12 dnia miesiąca.",
        "Posługa modlitwą wstawienniczą prowadzona w pierwszą i trzecią środę miesiąca w godz. od 17.00 do 18.00 w salce Miriam (główny budynek DD Tabor, poziom -1). Zapisy przez formularz na stronie internetowej www.miriam.rzeszow.pl"
    ];

    res.status(200).json({ date: dateUtils.toUtcDate(new Date()), announcements });
}

export default {
    getAnnouncements: getAnnouncements,
};