import { Router } from 'express';
import { createUser, getUser, updateUser } from './userController';

export const userRouter = Router();

userRouter.post('/create-user', createUser);
userRouter.get('/:userId', getUser);
userRouter.put('/:userId', updateUser);
