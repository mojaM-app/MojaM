import dateUtils from "../../utils/date.utils.js";

const getAnnouncements = (req, res) => {
    const announcements = [
        "Przypominamy o obowiązkowej modlitwie <b>Anioł Pański w intencji o otwartość na charyzmaty i ich przyjmowanie dla wszystkich członków wspólnoty przez ręce Maryi</b> oraz zachęcie Pasterza do <b>postu w intencji wspólnoty 12 dnia każdego miesiąca</b>.",
        "Posługa modlitwą wstawienniczą prowadzona w pierwszą i trzecią środę miesiąca w godz. od 17.00 do 18.00 w salce Miriam (główny budynek DD Tabor, poziom -1). Zapisy przez formularz na stronie internetowej www.miriam.rzeszow.pl",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    ];

    res.status(200).json({ date: dateUtils.toUtcDate(new Date()), announcements });
}

export default {
    getAnnouncements: getAnnouncements,
};