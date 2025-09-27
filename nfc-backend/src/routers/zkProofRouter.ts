import { Router } from 'express';
import { getContractOwner } from '../controllers/zkProofController';

export const zkProofRouter = Router();

zkProofRouter.get('/', getContractOwner);
