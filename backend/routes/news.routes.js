import express from 'express';
import announcementsController from '../controllers/news/announcements.controller.js';
import calendarController from '../controllers/news/calendar.controller.js';
import informationController from '../controllers/news/information.controller.js';

const router = express.Router();

router.get('/information', informationController.getInformation);

router.get('/calendar', calendarController.getCalendar);

router.get('/announcements', announcementsController.getAnnouncements);

export default router;