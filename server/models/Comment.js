const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const { generateExcerpt } = require('../utils/excerptUtils');

class Comment extends Model { }

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    post_id: {
      type: DataTypes.UUID,
      references: {
        model: 'post',
        key: 'id',
      },
    },
  },
  {
    hooks: {
      beforeCreate: async (comment) => {
        if (comment.comment_text) {
          comment.excerpt = generateExcerpt(comment.comment_text);
        }
      },
      beforeUpdate: async (comment) => {
        if (comment.changed('comment_text')) {
          comment.excerpt = generateExcerpt(comment.comment_text);
        }
      },
    },
    indexes: [
      { fields: ['post_id'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['post_id', 'created_at'] },
      { fields: ['user_id', 'created_at'] }
    ],
    sequelize,
    timestamps: true,
    freezeTableName: true,
    underscored: true,
    modelName: 'comment',
  }
);

module.exports = Comment;