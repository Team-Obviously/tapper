import { Router } from 'express';
import { createUser, getUser, updateUser, loginUser } from './userController';
export const userRouter = Router();
userRouter.post('/create-user', createUser);
userRouter.post('/login', loginUser);
userRouter.get('/:userId', getUser);
userRouter.put('/:userId', updateUser);
