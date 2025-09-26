import 'dotenv/config';
import express from 'express';
import { json } from 'express';
import { nfcRouter } from './routers/nfcRouter';
import { userRouter } from './routers/userRouter';
import { requestLogger } from './middleware/requestLogger';

const app = express();
app.use(json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/healthz', (_req, res) => {
    res.status(200).send('ok');
});

app.use('/api/users', userRouter);
app.use('/api/nfc', nfcRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});


