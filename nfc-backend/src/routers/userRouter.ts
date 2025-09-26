import { Router } from 'express';
import { createUser, getUser } from '../controllers/userController';

export const userRouter = Router();

userRouter.post('/create-user', createUser);
userRouter.get('/:userId', getUser);
