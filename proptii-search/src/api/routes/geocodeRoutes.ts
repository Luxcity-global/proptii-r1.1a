import { Router } from 'express';
import * as geocodeController from '../controllers/geocodeController';

const router = Router();

router.get('/', geocodeController.geocodeAddress);
router.get('/postcode', geocodeController.geocodePostcode);

export default router;
