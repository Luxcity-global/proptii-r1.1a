import { Router } from 'express';
import * as searchController from '../controllers/searchController';
import * as bookingController from '../controllers/bookingController';

const router = Router();

// Search endpoint (SSE)
router.post('/', searchController.searchProperties);

// Booking endpoint
router.post('/book-viewing', bookingController.bookViewing);

export default router;
