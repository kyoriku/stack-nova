const { Post, User, Comment } = require('../models');
const { generateSlug, findNextCounter } = require('../utils/slugUtils');
const redisService = require('../config/redisCache');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const ERROR_CODES = require('../constants/errorCodes');

// Helper function to handle common Redis cache operations
async function clearCaches(postId, userId, username, includeComments = false) {
  const cacheOps = [
    redisService.clearHomePageCache(),
    redisService.clearUserPostsCache(userId),
    redisService.clearUserProfileCache(username),
    redisService.invalidateSitemapCache()
  ];

  if (postId) {
    const post = await Post.findByPk(postId, { attributes: ['id', 'slug'] });
    if (post) {
      cacheOps.push(redisService.clearPostCache(post.id, includeComments));
      cacheOps.push(redisService.clearPostCache(post.slug, includeComments));
    } else {
      cacheOps.push(redisService.clearPostCache(postId, includeComments));
    }
  }

  return Promise.all(cacheOps);
}

// Common post query options
const postQueryOptions = {
  include: [
    {
      model: User,
      attributes: ['username']
    },
    {
      model: Comment,
      include: [{
        model: User,
        attributes: ['username']
      }]
    }
  ]
};

// Helper function to determine if a string is a UUID
const isUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const postController = {
  // Get all posts
  getAllPosts: asyncHandler(async (req, res) => {
    const postData = await Post.findAll({
      ...postQueryOptions,
      order: [['created_at', 'DESC']]
    });

    const posts = postData.map(post => post.get({ plain: true }));
    res.json(posts);
  }),

  getSinglePost: asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const postData = await Post.findOne({
      where: { slug },
      ...postQueryOptions
    });

    if (!postData) {
      throw new AppError('No post found', 404, ERROR_CODES.POST_NOT_FOUND);
    }

    res.json(postData.get({ plain: true }));
  }),

  // Get posts for current user
  getUserPosts: asyncHandler(async (req, res) => {
    if (!req.session.user_id) {
      throw new AppError(
        'You must be logged in to view your posts',
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const postData = await Post.findAll({
      where: { user_id: req.session.user_id },
      include: [{ model: User, attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(postData.map(post => post.get({ plain: true })));
  }),

  // Create a post
  createPost: asyncHandler(async (req, res) => {
    const userId = req.session.user_id;

    if (!userId) {
      throw new AppError(
        'You must be logged in to create a post',
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    if (!req.body.title || !req.body.content) {
      throw new AppError(
        'Title and content are required',
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const user = await User.findByPk(userId, {
      attributes: ['username']
    });

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    const baseSlug = generateSlug(req.body.title);
    let newPost;
    let attempts = 0;
    const maxRetries = 5;

    while (attempts < maxRetries) {
      try {
        let slug;

        if (attempts === 0) {
          // First attempt: try clean slug
          slug = baseSlug;
        } else {
          // Retry: find next available counter
          const counter = await findNextCounter(baseSlug);
          slug = `${baseSlug}-${counter}`;
        }

        // Try to create post
        newPost = await Post.create({
          title: req.body.title,
          content: req.body.content,
          slug: slug,
          user_id: userId,
          username: user.username
        });

        break; // Success! Exit retry loop

      } catch (error) {
        attempts++;

        // Check if it's a unique constraint error on slug
        if (error.name === 'SequelizeUniqueConstraintError' &&
          error.fields?.slug &&
          attempts < maxRetries) {
          // Slug collision - retry with counter
          // Small random delay to reduce thundering herd
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          continue;
        }

        // If not a slug error or out of retries, throw
        throw error;
      }
    }

    // If we exhausted retries
    if (!newPost) {
      throw new AppError(
        'Failed to create post after multiple attempts. Please try again.',
        500,
        ERROR_CODES.INTERNAL_ERROR
      );
    }

    const postWithDetails = await Post.findByPk(newPost.id, {
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['username']
          }]
        }
      ]
    });

    // Clear relevant caches
    await clearCaches(null, userId, user.username);

    res.status(201).json(postWithDetails.get({ plain: true }));
  }),

  updatePost: asyncHandler(async (req, res) => {
    const userId = req.session.user_id;
    const { slug } = req.params;

    if (!userId) {
      throw new AppError(
        'You must be logged in to update a post',
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    let whereClause = { user_id: userId, slug };

    const post = await Post.findOne({
      where: whereClause,
      include: [{ model: User, attributes: ['username'] }]
    });

    if (!post) {
      throw new AppError(
        'Post not found or you are not authorized to edit it',
        404,
        ERROR_CODES.POST_NOT_FOUND
      );
    }

    // If title is changing, generate new slug with retry logic
    const updateData = { ...req.body };

    if (req.body.title && req.body.title !== post.title) {
      const baseSlug = generateSlug(req.body.title);
      let attempts = 0;
      const maxRetries = 5;
      let newSlug = null;

      while (attempts < maxRetries) {
        try {
          if (attempts === 0) {
            // First attempt: try clean slug
            newSlug = baseSlug;
          } else {
            // Retry: find next available counter (excluding current post)
            const counter = await findNextCounter(baseSlug, post.id);
            newSlug = `${baseSlug}-${counter}`;
          }

          // Try to update with new slug
          updateData.slug = newSlug;
          await post.update(updateData);

          break; // Success! Exit retry loop

        } catch (error) {
          attempts++;

          // Check if it's a unique constraint error on slug
          if (error.name === 'SequelizeUniqueConstraintError' &&
            error.fields?.slug &&
            attempts < maxRetries) {
            // Slug collision - retry with counter
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
            continue;
          }

          // If not a slug error or out of retries, throw
          throw error;
        }
      }

      // If we exhausted retries
      if (attempts >= maxRetries && !newSlug) {
        throw new AppError(
          'Failed to update post after multiple attempts. Please try again.',
          500,
          ERROR_CODES.INTERNAL_ERROR
        );
      }
    } else {
      // Title not changing, just update other fields
      await post.update(updateData);
    }

    // Fetch the updated post with all relations
    const updatedPostWithDetails = await Post.findByPk(post.id, {
      ...postQueryOptions
    });

    // Clear relevant caches BEFORE sending response
    await clearCaches(post.id, userId, post.user.username);

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPostWithDetails.get({ plain: true })
    });
  }),

  // Delete a post
  deletePost: asyncHandler(async (req, res) => {
    const userId = req.session.user_id;
    const { slug } = req.params;

    if (!userId) {
      throw new AppError(
        'You must be logged in to delete a post',
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    let whereClause = { user_id: userId, slug };

    // Find the post to validate ownership
    const post = await Post.findOne({
      where: whereClause,
      include: [{ model: User, attributes: ['username'] }]
    });

    if (!post) {
      throw new AppError(
        'Post not found or you are not authorized to delete it',
        404,
        ERROR_CODES.POST_NOT_FOUND
      );
    }

    // Delete the post
    await post.destroy();

    // Clear relevant caches BEFORE sending response
    await clearCaches(post.id, userId, post.user.username, true);

    res.status(200).json({ message: 'Post deleted successfully' });
  })
};

module.exports = postController;