import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { authRouter } from './routes/auth';
import { rolesRouter } from './routes/roles';
import { conversationsRouter } from './routes/conversations';

const app = express();

// 基础中间件
app.use(helmet()); // 安全头
app.use(cors()); // CORS
app.use(express.json()); // JSON 解析
app.use(morgan('dev')); // 日志
app.use(rateLimiter); // 速率限制

// 路由
app.use('/api/auth', authRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/conversations', conversationsRouter);

// 错误处理
app.use(errorHandler);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 