import { User } from './User';
import { Role } from './Role';
import { Conversation } from './Conversation';
import { sequelize } from '../config/database';

// 建立模型关联
User.hasMany(Conversation, { foreignKey: 'user_id' });
Conversation.belongsTo(User, { foreignKey: 'user_id' });

Role.hasMany(Conversation, { foreignKey: 'role_id' });
Conversation.belongsTo(Role, { foreignKey: 'role_id' });

export {
  User,
  Role,
  Conversation,
  sequelize,
}; 