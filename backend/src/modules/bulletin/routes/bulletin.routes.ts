import { Router } from 'express';
import { Container } from 'typedi';
import { BulletinController } from '../controllers/bulletin.controller';

const router = Router();
const bulletinController = Container.get(BulletinController);

// Create new bulletin
router.post('/', bulletinController.create.bind(bulletinController));

// Get all bulletins
router.get('/', bulletinController.getAll.bind(bulletinController));

// Get published bulletins
router.get('/published', bulletinController.getPublished.bind(bulletinController));

// Get specific bulletin
router.get('/:id', bulletinController.get.bind(bulletinController));

// Update bulletin
router.put('/:id', bulletinController.update.bind(bulletinController));

// Publish bulletin
router.post('/:id/publish', bulletinController.publish.bind(bulletinController));

// Delete bulletin
router.delete('/:id', bulletinController.delete.bind(bulletinController));

// Get user progress for a bulletin
router.get('/:id/progress/:userId', bulletinController.getUserProgress.bind(bulletinController));

export default router;
