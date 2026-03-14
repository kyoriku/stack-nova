import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const postCreationRate = new Rate('post_creation_success');
const cacheHitRate = new Rate('cache_hits');
const apiErrors = new Counter('api_errors');
const dbQueryTime = new Trend('database_query_time');

// Test configuration
// LIGHT LOAD (Baseline test)
// export const options = {
//   stages: [
//     { duration: '30s', target: 3 },   // Warm up: 3 users
//     { duration: '1m', target: 8 },    // Ramp to 8 users
//     { duration: '2m', target: 8 },    // Hold at 8 users
//     { duration: '1m', target: 15 },   // Spike to 15 users
//     { duration: '30s', target: 0 },   // Ramp down
//   ],
//   thresholds: {
//     http_req_duration: ['p(95)<1500'],  // 95% under 1.5s (MySQL can be slow locally)
//     http_req_failed: ['rate<0.05'],     // Less than 5% errors
//     login_success: ['rate>0.90'],       // 90%+ login success
//     checks: ['rate>0.85'],              // 85%+ of all checks pass
//   },
// };

// BALANCED LOAD (Realistic)
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up to 10 users
    { duration: '2m', target: 20 },   // Ramp to 20 users
    { duration: '3m', target: 30 },   // Sustain at 30 users
    { duration: '1m', target: 30 },   // Hold at peak
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],  // 95% under 1.5s (strict)
    http_req_failed: ['rate<0.05'],     // Less than 5% errors
    login_success: ['rate>0.90'],       // 90%+ login success
    checks: ['rate>0.85'],              // 85%+ of all checks pass
  },
};

// MODERATE LOAD (Heavier traffic)
// export const options = {
//   stages: [
//     { duration: '1m', target: 10 },   // Warm up to 10 users
//     { duration: '2m', target: 25 },   // Ramp to 25 users
//     { duration: '3m', target: 25 },   // Hold at 25 users
//     { duration: '2m', target: 50 },   // Spike to 50 users
//     { duration: '1m', target: 50 },   // Hold spike
//     { duration: '1m', target: 0 },    // Ramp down
//   ],
//   thresholds: {
//     http_req_duration: ['p(95)<2000'],  // 95% under 2s (more lenient)
//     http_req_failed: ['rate<0.10'],     // Less than 10% errors (more lenient)
//     login_success: ['rate>0.85'],       // 85%+ login success
//     checks: ['rate>0.80'],              // 80%+ of all checks pass
//   },
// };

// STRESS TEST (Find breaking point)
// export const options = {
//   stages: [
//     { duration: '2m', target: 20 },   // Ramp to 20 users
//     { duration: '3m', target: 50 },   // Ramp to 50 users
//     { duration: '2m', target: 75 },   // Push to 75 users
//     { duration: '2m', target: 100 },  // Stress test at 100 users
//     { duration: '2m', target: 100 },  // Hold at 100
//     { duration: '2m', target: 0 },    // Ramp down
//   ],
//   thresholds: {
//     http_req_duration: ['p(95)<3000'],  // 95% under 3s
//     http_req_failed: ['rate<0.15'],     // Less than 15% errors
//     login_success: ['rate>0.75'],       // 75%+ login success
//     checks: ['rate>0.70'],              // 70%+ of all checks pass
//   },
// };

// SPIKE TEST (Sudden traffic surge)
// export const options = {
//   stages: [
//     { duration: '2m', target: 10 },   // Normal load
//     { duration: '30s', target: 100 }, // Sudden spike!
//     { duration: '3m', target: 100 },  // Hold spike
//     { duration: '2m', target: 10 },   // Return to normal
//     { duration: '1m', target: 0 },    // Ramp down
//   ],
//   thresholds: {
//     http_req_duration: ['p(95)<3000'],
//     http_req_failed: ['rate<0.20'],     // Allow more errors during spike
//     login_success: ['rate>0.70'],
//     checks: ['rate>0.65'],
//   },
// };

// SOAK TEST (Long duration, find memory leaks)
// export const options = {
//   stages: [
//     { duration: '2m', target: 20 },   // Ramp to 20 users
//     { duration: '30m', target: 20 },  // Hold for 30 minutes
//     { duration: '2m', target: 0 },    // Ramp down
//   ],
//   thresholds: {
//     http_req_duration: ['p(95)<2000'],
//     http_req_failed: ['rate<0.10'],
//     login_success: ['rate>0.85'],
//     checks: ['rate>0.80'],
//   },
// };

const BASE_URL = 'http://localhost:3001';

// Test data - these will be created in setup()
const TEST_USERS = [
  { username: 'k6test1', email: 'k6test1@example.com', password: 'TestPass123!' },
  { username: 'k6test2', email: 'k6test2@example.com', password: 'TestPass123!' },
  { username: 'k6test3', email: 'k6test3@example.com', password: 'TestPass123!' },
];

const POST_TITLES = [
  'Understanding JavaScript Closures',
  'MySQL Performance Tips',
  'Redis Caching Strategies',
  'Node.js Best Practices',
  'Express Middleware Guide',
];

const POST_CONTENT = [
  'JavaScript closures are a fundamental concept. A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). In other words, a closure gives you access to an outer function\'s scope from an inner function.',
  'MySQL query optimization starts with proper indexing. Always analyze your queries with EXPLAIN to understand how MySQL executes them. Composite indexes can dramatically improve performance for multi-column WHERE clauses.',
  'Redis is an in-memory data structure store that can be used as a cache. The key to effective caching is choosing the right TTL (time to live) and invalidation strategy. Always cache expensive database queries.',
  'Best practices for Node.js include proper error handling, using environment variables for configuration, implementing graceful shutdowns, and monitoring memory usage to prevent leaks.',
  'Express middleware functions are the building blocks of your application. They have access to the request, response, and next middleware function. Common patterns include authentication, logging, and error handling.',
];

// Helper functions
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function extractSessionCookie(response) {
  const cookies = response.cookies;
  const sessionId = cookies.sessionId?.[0]?.value;
  return sessionId ? `sessionId=${sessionId}` : null;
}

// SETUP: Create test users before test starts
export function setup() {
  console.log('\n=== SETUP: Creating test users ===');

  const createdUsers = [];

  for (const user of TEST_USERS) {
    const res = http.post(
      `${BASE_URL}/api/users`,
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 201) {
      console.log(`✓ Created user: ${user.username}`);
      createdUsers.push(user);
    } else if (res.status === 400) {
      // Parse JSON response to check error code
      try {
        const body = JSON.parse(res.body);
        if (body.code === 'DUPLICATE_ENTRY' || body.message?.includes('already exists')) {
          console.log(`⊙ User already exists: ${user.username}`);
          createdUsers.push(user);
        } else {
          console.error(`✗ Failed to create user ${user.username}: ${res.status} - ${res.body}`);
        }
      } catch (e) {
        // If response isn't JSON, check string
        if (res.body.includes('already exists')) {
          console.log(`⊙ User already exists: ${user.username}`);
          createdUsers.push(user);
        } else {
          console.error(`✗ Failed to create user ${user.username}: ${res.status} - ${res.body}`);
        }
      }
    } else {
      console.error(`✗ Failed to create user ${user.username}: ${res.status} - ${res.body}`);
    }
  }

  console.log('\n=== Test Configuration ===');
  console.log('Monitor these during the test:');
  console.log('1. Terminal running your server (Sequelize query logs)');
  console.log('2. Redis: redis-cli --stat');
  console.log('3. Redis cache: redis-cli monitor | grep "GET\\|SET"');
  console.log('4. MySQL: Watch connection count and slow queries');
  console.log('5. System resources: htop or Activity Monitor\n');

  return { users: createdUsers };
}

// Test 1: Health Check
export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'health check status 200': (r) => r.status === 200,
    'health check has status': (r) => r.json('status') !== undefined,
    'database connected': (r) => r.json('database') === 'Connected',
    'redis connected': (r) => r.json('redis') === 'Connected',
  }) || apiErrors.add(1);
}

// Test 2: Login helper
function login(email, password) {
  const loginRes = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const success = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login returns user': (r) => r.json('user') !== undefined,
  });

  loginSuccessRate.add(success);

  if (!success) {
    apiErrors.add(1);
    console.error(`Login failed for ${email}: ${loginRes.status} - ${loginRes.body}`);
    return null;
  }

  return extractSessionCookie(loginRes);
}

// Test 3: Anonymous User Journey (Read-Only)
export function anonymousUserJourney() {
  group('Anonymous User - Browse Content', () => {
    // 1. Get all posts (should trigger cache MISS first time)
    const postsRes = http.get(`${BASE_URL}/api/posts`);

    const postsCheck = check(postsRes, {
      'posts status 200': (r) => r.status === 200,
      'posts return array': (r) => Array.isArray(r.json()),
      'posts response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (!postsCheck) apiErrors.add(1);

    sleep(1);

    // 2. Get a specific post by slug (test cache)
    const posts = postsRes.json();
    if (posts && posts.length > 0) {
      const randomPost = randomItem(posts);

      const postRes = http.get(`${BASE_URL}/api/posts/${randomPost.slug}`);

      check(postRes, {
        'single post status 200': (r) => r.status === 200,
        'post has title': (r) => r.json('title') !== undefined,
        'post has comments array': (r) => Array.isArray(r.json('comments')),
        'post response time < 1.5s': (r) => r.timings.duration < 1500,
      }) || apiErrors.add(1);

      sleep(2);

      // 3. Get user profile
      if (randomPost.user?.username) {
        const profileRes = http.get(`${BASE_URL}/api/users/profile/${randomPost.user.username}`);

        check(profileRes, {
          'profile status 200': (r) => r.status === 200,
          'profile has username': (r) => r.json('username') !== undefined,
          'profile has posts': (r) => Array.isArray(r.json('posts')),
        }) || apiErrors.add(1);
      }
    }

    sleep(1);
  });
}

// Test 4: Authenticated User Journey (Full CRUD)
export function authenticatedUserJourney() {
  const user = randomItem(TEST_USERS);

  group('Authenticated User - Full Actions', () => {
    // 1. Login
    const sessionCookie = login(user.email, user.password);

    if (!sessionCookie) {
      console.error('Login failed, skipping authenticated actions');
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    };

    sleep(1);

    // 2. Check session status
    const sessionRes = http.get(`${BASE_URL}/api/users/session`, { headers });
    check(sessionRes, {
      'session check returns user': (r) => r.json('user') !== undefined,
    }) || apiErrors.add(1);

    sleep(1);

    // 3. Create a post
    const newPost = {
      title: randomItem(POST_TITLES),
      content: randomItem(POST_CONTENT),
    };

    const createRes = http.post(
      `${BASE_URL}/api/posts`,
      JSON.stringify(newPost),
      { headers }
    );

    const postCreated = check(createRes, {
      'post created status 201': (r) => r.status === 201,
      'post has id': (r) => r.json('id') !== undefined,
      'post has slug': (r) => r.json('slug') !== undefined,
    });

    postCreationRate.add(postCreated);
    if (!postCreated) {
      apiErrors.add(1);
      console.error(`Post creation failed: ${createRes.status} - ${createRes.body}`);
    }

    const createdPostId = createRes.json('id');
    const createdPostSlug = createRes.json('slug');

    sleep(2);

    // 4. Get user's own posts (tests user-specific cache)
    const userPostsRes = http.get(`${BASE_URL}/api/posts/user/posts`, { headers });

    check(userPostsRes, {
      'user posts status 200': (r) => r.status === 200,
    }) || apiErrors.add(1);

    sleep(1);

    // 5. Get all posts again (cache should be invalidated after creation)
    const postsRes = http.get(`${BASE_URL}/api/posts`);
    check(postsRes, {
      'posts after creation status 200': (r) => r.status === 200,
    }) || apiErrors.add(1);

    sleep(2);

    // 6. Create a comment on a random post
    const posts = postsRes.json();
    if (posts && posts.length > 0) {
      const randomPost = randomItem(posts);

      const commentRes = http.post(
        `${BASE_URL}/api/comments`,
        JSON.stringify({
          post_id: randomPost.id,
          comment_text: 'Great post! Very informative and well-written.',
        }),
        { headers }
      );

      check(commentRes, {
        'comment created status 201': (r) => r.status === 201,
      }) || apiErrors.add(1);
    }

    sleep(1);

    // 7. Update the created post (if successful)
    if (postCreated && createdPostSlug) {
      const updateRes = http.put(
        `${BASE_URL}/api/posts/${createdPostSlug}`,
        JSON.stringify({
          title: newPost.title + ' (Updated)',
          content: newPost.content + '\n\nUpdated with additional information.',
        }),
        { headers }
      );

      check(updateRes, {
        'post updated status 200': (r) => r.status === 200,
      }) || apiErrors.add(1);

      sleep(1);
    }

    // 8. Heartbeat check (simulates frontend keepalive)
    const heartbeatRes = http.get(`${BASE_URL}/api/users/heartbeat`, { headers });
    check(heartbeatRes, {
      'heartbeat active': (r) => r.status === 200 && r.json('active') === true,
    }) || apiErrors.add(1);

    sleep(1);

    // 9. Logout
    const logoutRes = http.post(`${BASE_URL}/api/users/logout`, null, { headers });
    check(logoutRes, {
      'logout success': (r) => r.status === 204,
    }) || apiErrors.add(1);
  });
}

// Test 5: Cache Effectiveness Test
export function cacheEffectivenessTest() {
  group('Cache Performance Test', () => {
    // Hit the same endpoint twice to test cache
    const firstReq = http.get(`${BASE_URL}/api/posts`);
    const firstTime = firstReq.timings.duration;

    sleep(0.5);

    const secondReq = http.get(`${BASE_URL}/api/posts`);
    const secondTime = secondReq.timings.duration;

    // Second request should be faster (cached)
    const isFaster = secondTime < firstTime;
    cacheHitRate.add(isFaster ? 1 : 0);

    check(secondReq, {
      'cached request is faster': () => isFaster,
      'both requests succeeded': (r) => r.status === 200,
    });
  });
}

// Test 6: Rate Limiter Test (Tests your rate limiting)
export function rateLimiterTest() {
  group('Rate Limiter Behavior', () => {
    const sessionCookie = login(randomItem(TEST_USERS).email, 'TestPass123!');

    if (!sessionCookie) return;

    const headers = {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    };

    // Rapid fire requests to trigger rate limiter
    let rateLimited = false;
    for (let i = 0; i < 10; i++) {
      const res = http.get(`${BASE_URL}/api/posts`, { headers });
      if (res.status === 429) {
        rateLimited = true;
        console.log(`Rate limiter triggered after ${i + 1} requests`);
        break;
      }
      sleep(0.1);
    }
  });
}

// MAIN EXECUTION - Weighted scenarios
export default function () {
  const scenario = Math.random();

  if (scenario < 0.5) {
    // 50% anonymous browsing (most common)
    anonymousUserJourney();
  } else if (scenario < 0.85) {
    // 35% authenticated users
    authenticatedUserJourney();
  } else if (scenario < 0.95) {
    // 10% cache tests
    cacheEffectivenessTest();
  } else {
    // 5% health checks
    healthCheck();
  }
}

// TEARDOWN: Summary
export function teardown(data) {
  console.log('\n=== TEST COMPLETED ===');
  console.log('Check the k6 output above for:');
  console.log('  • http_req_duration (response times)');
  console.log('  • http_req_failed (error rate)');
  console.log('  • login_success (authentication success rate)');
  console.log('  • cache_hits (Redis cache effectiveness)');
  console.log('  • checks (overall health)');
  console.log('\nNext steps:');
  console.log('  1. Review Sequelize query logs for slow queries');
  console.log('  2. Check Redis stats for memory usage');
  console.log('  3. Monitor MySQL connection pool');
  console.log('  4. If all looks good, increase load in options.stages');
}