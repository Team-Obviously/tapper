import { Router } from 'express';
import { sendInvitation, getPendingInvitations, respondToInvitation, getAcceptedConnections, getUsersWithSharedInterests, getSentInvitations } from '../controllers/invitationController';
const router = Router();
// Send an invitation
router.post('/send', sendInvitation);
// Get pending invitations for a user
router.get('/pending/:userId', getPendingInvitations);
// Respond to an invitation
router.put('/respond/:invitationId', respondToInvitation);
// Get accepted connections for a user
router.get('/accepted/:userId', getAcceptedConnections);
// Get users with shared interests (for sending invitations)
router.get('/shared-interests/:userId/:interest', getUsersWithSharedInterests);
// Get invitations sent by a user
router.get('/sent/:userId', getSentInvitations);
export default router;
