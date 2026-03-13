import { PostItem } from './PostItem';

export const PostsList = ({ posts, prefetchPost }) => (
  <section
    aria-label="Posts list"
    className="max-w-4xl mx-auto"
  >
    <h2 className="sr-only">Blog posts</h2>
    <div role="feed" aria-busy="false" aria-label="Blog posts" className="space-y-6">
      {posts.map((post, index) => (
        <div
          key={post.id}
          // style={{
          //   animation: 'fadeInUp 0.25s ease-out forwards',
          //   animationDelay: `${index * 0.05}s`,
          //   opacity: 0
          // }}
        >
          <PostItem post={post} prefetchPost={prefetchPost} />
        </div>
      ))}
    </div>

    {/* <style>{`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style> */}
  </section>
);