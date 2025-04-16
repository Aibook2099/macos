import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在windowMs内最多100个请求
  standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` headers中
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'You have exceeded the rate limit. Please try again later.'
    }
  }
}); 