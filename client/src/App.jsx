import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Posts from "./pages/Posts";
import PostDetails from "./pages/PostDetails";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import NewPost from "./pages/NewPost";
import EditPost from "./pages/EditPost";
import NotFound from "./pages/NotFound";
import DashboardWrapper from "./components/DashboardWrapper";
import UserProfileWrapper from "./components/UserProfileWrapper";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <ErrorBoundary><Posts /></ErrorBoundary> },
      { path: "post/:slug", element: <ErrorBoundary><PostDetails /></ErrorBoundary> },
      {
        path: "user/:username",
        element: <UserProfileWrapper />
      },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },

      // Protected routes group
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "dashboard",
            element: <DashboardWrapper />
          },
          { path: "new-post", element: <ErrorBoundary><NewPost /></ErrorBoundary> },
          { path: "edit-post/:slug", element: <ErrorBoundary><EditPost /></ErrorBoundary> },
        ],
      },
      { path: "*", element: <NotFound /> }
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;