import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/user/UserProfile";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import { useEffect, useState } from "react";
import axios from "axios";
import SessionExpiredModal from "./components/SessionExpiredModal";

import { VotingProvider } from "./context/VotingContext";
import { AdminProvider } from "./context/AdminContext";

import Overview from "./pages/user/Overview";
import InstitutionList from "./pages/user/InstitutionList";
import OrganizationList from "./pages/user/OrganizationList";
import PostList from "./pages/user/PostList";
import CandidateVoting from "./pages/user/CandidateVoting";
import ResultsChart from "./pages/user/ResultsChart";
import Transactions from "./pages/user/Transactions";
import Elections from "./pages/user/Elections";

import AdminDashboardHome from "./pages/admin/Dashboard";
import AdminInstitutions from "./pages/admin/Institutions";
import AdminOrganizations from "./pages/admin/Organizations";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminPosts from "./pages/admin/Posts";
import AdminViewCandidates from "./pages/admin/ViewCandidates";
import AdminRequests from "./pages/admin/Requests";
import AdminResults from "./pages/admin/Results";
import AdminUsers from "./pages/admin/Users";
import AdminTransactions from "./pages/admin/Transactions";
import AllElections from "./pages/admin/AllElections";
import CompleteCandidate from "./pages/user/CompleteCandidate";

import NotFound from "./pages/NotFound";
import About from "./pages/About";

import "./style.css";


function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    return null;
  }
}


function HomeRedirect() {
  const user = getStoredUser();

  if (user?.role === "superadmin") {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === "voter") {
    return <Navigate to="/user" replace />;
  }

  return <Landing />;
}


function UserSection() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "voter") {
    return <Navigate to="/" replace />;
  }

  return (
    <VotingProvider>
      <UserLayout />
    </VotingProvider>
  );
}


function AdminSection() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    user.role !== "admin" &&
    user.role !== "superadmin"
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminProvider>
      <AdminLayout />
    </AdminProvider>
  );
}


function App() {
  const user = getStoredUser();

  const [sessionExpired, setSessionExpired] =
    useState(false);

  useEffect(() => {
    const interceptor =
      axios.interceptors.response.use(
        (response) => response,

        (error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem(
              "access_token"
            );
            localStorage.removeItem("user");
            localStorage.removeItem(
              "adminWallet"
            );

            setSessionExpired(true);
          }

          return Promise.reject(error);
        }
      );

    return () => {
      axios.interceptors.response.eject(
        interceptor
      );
    };
  }, []);

  const handleLoginAgain = () => {
    setSessionExpired(false);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
  <SessionExpiredModal
    open={sessionExpired}
    onLoginAgain={handleLoginAgain}
  />

  <Routes>

        {/* PUBLIC */}

        <Route
          path="/"
          element={<HomeRedirect />}
        />

        <Route
          path="/login"
          element={
            user ? (
              <HomeRedirect />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <HomeRedirect />
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/about"
          element={<About />}
        />

        

        {/* ADMIN + SUPERADMIN */}

        <Route
          path="/admin"
          element={<AdminSection />}
        >
          <Route
            index
            element={<AdminDashboardHome />}
          />

          <Route
  path="profile"
  element={<AdminProfile />}
/>

          <Route
            path="institutions"
            element={<AdminInstitutions />}
          />

          <Route
            path="organizations"
            element={<AdminOrganizations />}
          />

          <Route
            path="posts"
            element={<AdminPosts />}
          />

          <Route
            path="view-candidates"
            element={<AdminViewCandidates />}
          />

          <Route
  path="requests"
  element={<AdminRequests />}
/>

          <Route
            path="results"
            element={<AdminResults />}
          />

          <Route
            path="users"
            element={<AdminUsers />}
          />

          <Route
            path="transactions"
            element={<AdminTransactions />}
          />

          <Route
            path="elections"
            element={<AllElections />}
          />
        </Route>

        {/* VOTER */}

        <Route
          path="/user"
          element={<UserSection />}
        >
          <Route
            index
            element={<Overview />}
          />

          <Route
  path="profile"
  element={<UserProfile />}
/>

          <Route
            path="elections"
            element={<Elections />}
          />

          {/* VOTE */}

          <Route
            path="vote"
            element={
              <InstitutionList mode="vote" />
            }
          />

          <Route
            path="vote/:instId"
            element={
              <OrganizationList mode="vote" />
            }
          />

          <Route
            path="vote/:instId/:orgId"
            element={
              <PostList mode="vote" />
            }
          />

          <Route
            path="vote/:instId/:orgId/:postId"
            element={<CandidateVoting />}
          />

          {/* BECOME CANDIDATE */}

          <Route
            path="request"
            element={
              <InstitutionList mode="request" />
            }
          />

          <Route
            path="request/:instId"
            element={
              <OrganizationList mode="request" />
            }
          />

          <Route
  path="complete-candidate/:instId/:orgId/:postId"
  element={<CompleteCandidate />}
/>

          <Route
            path="request/:instId/:orgId"
            element={
              <PostList mode="request" />
            }
          />

          {/* RESULTS */}

          <Route
            path="results"
            element={
              <InstitutionList mode="results" />
            }
          />

          <Route
            path="results/:instId"
            element={
              <OrganizationList mode="results" />
            }
          />

          <Route
            path="results/:instId/:orgId"
            element={
              <PostList mode="results" />
            }
          />

          <Route
            path="results/:instId/:orgId/:postId"
            element={<ResultsChart />}
          />

          <Route
            path="transactions"
            element={<Transactions />}
          />
        </Route>

        {/* 404 */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;