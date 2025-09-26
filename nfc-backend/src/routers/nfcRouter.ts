import { Router } from 'express';
import { createNfc } from '../controllers/nfcController';

export const nfcRouter = Router();

nfcRouter.post('/', createNfc);


