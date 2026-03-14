const router = require('express').Router();
const commentController = require('../../controllers/commentController');
const withAuth = require('../../middleware/auth');
const { commentLimiter } = require('../../middleware/rateLimiter');
const { validateNewComment, validateCommentUpdate } = require('../../middleware/validate');
const { sessionSecurity } = require('../../middleware/sessionSecurity');

// Protected routes (require authentication)
router.post('/', sessionSecurity, withAuth, commentLimiter, validateNewComment, commentController.createComment);
router.put('/:id', sessionSecurity, withAuth, validateCommentUpdate, commentController.updateComment);
router.delete('/:id', sessionSecurity, withAuth, commentController.deleteComment);

module.exports = router;