import { Router } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { Conversation } from '../models/Conversation';
import { Role } from '../models/Role';

const router = Router();

// 发起对话
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { role_id, message } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      throw new AppError(401, 'User not authenticated', 'UNAUTHORIZED');
    }

    // 验证输入
    if (!role_id || !message) {
      throw new AppError(400, 'Missing required fields', 'MISSING_FIELDS');
    }

    // 检查角色是否存在
    const role = await Role.findByPk(role_id);
    if (!role) {
      throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');
    }

    // TODO: 调用 AI 引擎生成回复
    const response = 'This is a mock response from the AI engine.';
    const emotion = 'neutral';

    // 创建对话记录
    const conversation = await Conversation.create({
      user_id,
      role_id,
      message,
      response,
      emotion,
    });

    res.status(201).json({
      status: 'success',
      data: {
        conversation: {
          id: conversation.id,
          role_id: conversation.role_id,
          message: conversation.message,
          response: conversation.response,
          emotion: conversation.emotion,
          created_at: conversation.created_at,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// 获取对话历史
router.get('/:role_id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { role_id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      throw new AppError(401, 'User not authenticated', 'UNAUTHORIZED');
    }

    // 检查角色是否存在
    const role = await Role.findByPk(role_id);
    if (!role) {
      throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: conversations } = await Conversation.findAndCountAll({
      where: {
        user_id,
        role_id,
      },
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          role_id: conversation.role_id,
          message: conversation.message,
          response: conversation.response,
          emotion: conversation.emotion,
          created_at: conversation.created_at,
        })),
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export const conversationsRouter = router; 