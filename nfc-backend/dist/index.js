import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import { nfcRouter } from './routers/nfcRouter';
import { userRouter } from './controllers/userRouter';
import { similarityRouter } from './routers/similarityRouter';
import { zkSimilarityRouter } from './routers/zkSimilarityRouter';
import { contractRouter } from './routers/contractRouter';
import invitationRouter from './routers/invitationRouter';
import telegramRouter from './routers/telegramRouter';
import { requestLogger } from './middleware/requestLogger';
const app = express();
app.use(cors());
app.use(json()); // Parse JSON request bodies
app.use(urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(requestLogger);
app.get('/healthz', (_req, res) => {
    res.status(200).send('ok');
});
app.use('/api/users', userRouter);
app.use('/api/nfc', nfcRouter);
app.use('/api/similarity', similarityRouter);
app.use('/api/zk-similarity', zkSimilarityRouter);
app.use('/api/contract', contractRouter);
app.use('/api/invitations', invitationRouter);
app.use('/api/telegram', telegramRouter);
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
