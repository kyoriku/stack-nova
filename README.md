# StackNova

A software engineer community platform where developers ask questions, share knowledge, and engage in technical discussions.

**[Live Site](https://stacknova.ca)** | **Tech Stack:** React, Node.js, Express, MySQL, Redis, Tailwind CSS

**Key Features:** HTTP-only cookie authentication • Markdown with syntax highlighting • Redis caching • Search • Light/dark modes • Rate limiting & XSS prevention

![Home Page](client/public/readme-screenshots/home.png)

<details>
<summary><b>Built With</b></summary>

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=for-the-badge&logo=JavaScript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=TailwindCSS&logoColor=white)](https://tailwindcss.com/docs/installation/using-vite)
[![React Query](https://img.shields.io/badge/React%20Query-FF4154.svg?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query/latest/docs/framework/react/installation)
[![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000.svg?style=for-the-badge&logo=Express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1.svg?style=for-the-badge&logo=MySQL&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7.svg?style=for-the-badge&logo=Sequelize&logoColor=white)](https://sequelize.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D.svg?style=for-the-badge&logo=Redis&logoColor=white)](https://redis.io/)
[![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=for-the-badge&logo=Vite&logoColor=white)](https://vite.dev/guide/)

</details>

## Table of Contents
- [Technical Details](#technical-details)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Questions](#questions)

## Technical Details

**Frontend**
- React with hooks and Context API
- React Query for data fetching and caching
- Tailwind CSS with dark/light mode
- Code splitting and lazy loading
- Markdown rendering with syntax highlighting (react-markdown, prism-react-renderer)

**Backend**
- Node.js/Express REST API
- Express-session with HTTP-only cookies
- Session storage in Redis (connect-redis)
- Google OAuth integration (Passport.js)
- Bcrypt password hashing
- Rate limiting with Redis store (express-rate-limit, rate-limit-redis)
- Input validation (express-validator) and sanitization (sanitize-html)
- Helmet.js security headers

**Database**
- MySQL with Sequelize ORM
- Models: User, Post, Comment with associations
- UUID primary keys
- Indexed queries (email, slug, user_id, post_id)

**Performance & Caching**
- Redis for server-side caching and sessions
- React Query for client-side caching and prefetching
- Performance benchmarking with perf_hooks
- Load tested with k6 (50 concurrent users)

**Features**
- Search by title, content, author, date, or comments
- Pagination (10 posts per page)
- User profiles with activity tracking
- SEO-friendly URLs with automatic slug generation
- Sitemap generation for search engines
- Remember Me option (30-day sessions)
- XSS prevention via sanitization

## Screenshots
<details>
<summary><b>View More Screenshots</b></summary>

![Post Details](client/public/readme-screenshots/post.png)
![User Dashboard](client/public/readme-screenshots/dashboard.png)
![User Profile](client/public/readme-screenshots/profile.png)

</details>

## Installation
To run this project locally:

1. Clone the repository
    ```bash
    git clone https://github.com/kyoriku/stack-nova.git
    ```

2. Navigate to the project directory
    ```bash
    cd stack-nova
    ```

3. Install dependencies
    ```bash
    npm install
    ```
 
4. Create a `.env` file in the server directory
    ```bash
    # Database Configuration
    DB_NAME='stacknova_db'
    DB_USER='your_MySQL_username'
    DB_PASSWORD='your_MySQL_password'
    
    # Session Configuration
    SESSION_SECRET='your_session_secret' # Generate using: openssl rand -hex 32
    
    # Redis Configuration
    REDIS_URL='redis://localhost:6379'
    
    # URLs
    CLIENT_URL='http://localhost:3000'
    SERVER_URL='http://localhost:3001'
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID='your_google_client_id'
    GOOGLE_CLIENT_SECRET='your_google_client_secret'
    
    # Node Environment
    NODE_ENV='development'
    ```

5. Set up the database
    ```bash
    mysql -u root -p
    source db/schema.sql
    ```

6. Set up Redis (required for sessions and caching)
    ```bash
    # Install Redis if not already installed
    # For macOS:
    brew install redis
    
    # For Ubuntu:
    sudo apt-get install redis-server
    
    # Start Redis server
    redis-server
    ```

7. (Optional) Seed the database
    ```bash
    npm run seed
    ```

## Usage
1. Start the development server
    ```bash
    npm run dev
    ```

2. Access the application at `http://localhost:3000`

3. Create an account to ask questions, post answers, and view your activity

## Roadmap
- [x] Accessibility improvements
- [x] SEO meta tags
- [x] Favicon
- [x] Code modularization
- [x] Social login options
- [ ] Answer acceptance feature
- [ ] User reputation system
- [ ] Real-time notifications

## Contributing
Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Make your changes
4. Commit and push to your branch
5. Open a Pull Request

## License
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&logo=mit)](https://opensource.org/licenses/MIT)

This project is licensed under the [MIT](https://opensource.org/licenses/MIT) license.

## Questions
For questions, email me at devkyoriku@gmail.com.