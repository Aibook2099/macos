import { Router } from 'express';
import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { authenticate } from '../middlewares/auth';
import { Role } from '../models/Role';

const router = Router();

// 创建角色
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, description, personality_traits } = req.body;

    // 验证输入
    if (!name || !description || !personality_traits) {
      throw new AppError(400, 'Missing required fields', 'MISSING_FIELDS');
    }

    // 检查角色是否已存在
    const existingRole = await Role.findOne({
      where: { name },
    });

    if (existingRole) {
      throw new AppError(409, 'Role already exists', 'ROLE_EXISTS');
    }

    // 创建新角色
    const role = await Role.create({
      name,
      description,
      personality_traits,
    });

    res.status(201).json({
      status: 'success',
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          personality_traits: role.personality_traits,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// 获取角色列表
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows: roles } = await Role.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          personality_traits: role.personality_traits,
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

// 获取角色详情
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');
    }

    res.status(200).json({
      status: 'success',
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          personality_traits: role.personality_traits,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export const rolesRouter = router; 