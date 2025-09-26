import { Router } from 'express';
import { registerNfc, getUserNfcs, connectNfc, getUserConnections, toggleNfcStatus } from '../controllers/nfcController';

export const nfcRouter = Router();

// Register user's own NFC
nfcRouter.post('/register', registerNfc);

// Get user's NFCs
nfcRouter.get('/user/:userId', getUserNfcs);

// Connect with someone else's NFC
nfcRouter.post('/connect', connectNfc);

// Get user's connections
nfcRouter.get('/connections/:userId', getUserConnections);

// Toggle NFC status
nfcRouter.patch('/toggle/:nfcId', toggleNfcStatus);


