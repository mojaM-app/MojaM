import express from 'express';
import controller from '../controllers/community.controller.js'

const router = express.Router();

router.get('/meetings', controller.getMeetings);

router.get('/diaconie', controller.getDiaconie);

router.get('/mission', controller.getMission);

router.get('/structure', controller.getStructure);

router.get('/regulations', controller.getRegulations);

export default router;