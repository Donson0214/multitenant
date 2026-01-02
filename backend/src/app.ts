import express from 'express';
import cors from 'cors';
import routes from '@/routes';
import { requestContextMiddleware } from '@/middleware/requestContext.middleware';
import { errorMiddleware } from '@/middleware/error.middleware';

export const app = express();

app.use(cors());
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(requestContextMiddleware);

app.use(routes);

app.use(errorMiddleware);
