const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const { generateExcerpt } = require('../utils/excerptUtils');

class Post extends Model { }

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 255],
        is: /^[a-z0-9-]+$/,
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'user',
        key: 'id',
      },
    },
  },
  {
    hooks: {
      beforeCreate: async (post) => {
        if (post.content) {
          post.excerpt = generateExcerpt(post.content);
        }
      },
      beforeUpdate: async (post) => {
        if (post.changed('content')) {
          post.excerpt = generateExcerpt(post.content);
        }
      },
    },
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] }, 
      { fields: ['user_id', 'created_at'] }
    ],
    sequelize,
    timestamps: true,
    freezeTableName: true,
    underscored: true,
    modelName: 'post',
  }
);

module.exports = Post;