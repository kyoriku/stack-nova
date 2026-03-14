const router = require('express').Router();
const postController = require('../../controllers/postController');
const withAuth = require('../../middleware/auth');
const cacheMiddleware = require('../../middleware/cache');
const { postLimiter } = require('../../middleware/rateLimiter');
const { validateNewPost, validatePostUpdate } = require('../../middleware/validate');
const { sessionSecurity } = require('../../middleware/sessionSecurity');

// Public routes
router.get('/', cacheMiddleware, postController.getAllPosts);
router.get('/user/posts', cacheMiddleware, postController.getUserPosts);
router.get('/:slug', cacheMiddleware, postController.getSinglePost);

// Protected routes (require authentication)
router.post('/', sessionSecurity, withAuth, postLimiter, validateNewPost, postController.createPost);
router.put('/:slug', sessionSecurity, withAuth, validatePostUpdate, postController.updatePost);
router.delete('/:slug', sessionSecurity, withAuth, postController.deletePost);

module.exports = router;