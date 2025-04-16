import { Router } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { User } from '../models/User';
import { hashPassword, comparePasswords, generateToken } from '../utils/auth';

const router = Router();

// 用户注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      throw new AppError(400, 'Missing required fields', 'MISSING_FIELDS');
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new AppError(409, 'User already exists', 'USER_EXISTS');
    }

    // 创建新用户
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
    });

    // 生成 token
    const token = generateToken(user);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 用户登录
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      throw new AppError(400, 'Missing required fields', 'MISSING_FIELDS');
    }

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // 验证密码
    const isValidPassword = await comparePasswords(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // 生成 token
    const token = generateToken(user);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

export const authRouter = router; 