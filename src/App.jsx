import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";

import ProtectedRoute from "./Components/ProtectedRoute";

import ShowCategory from "./Common/ShowCategory";
import TransportSlip from "./Common/TransportSlip";

import UsersList from "./Admin/Users/UsersList";
import EditUser from "./Admin/Users/EditUser";
import UserLikedPackages from "./Admin/UserLikedPackages/UserLikedPackages";
import PackageViewAnalytics from "./Admin/PackageViews/PackageViewAnalytics";
import CacheManagement from "./Admin/CacheManagement/CacheManagement";
import AdministratorAccounts from "./Admin/AdministratorAccounts/AdministratorAccounts";
import OccasionPopups from "./Admin/OccasionPopups/OccasionPopups";
import CustomerSubmissions from "./Admin/CustomerSubmissions/CustomerSubmissions";

import EnquiryList from "./Admin/Enquiry/EnquiryList";


import PaymentsList from "./Admin/Payments/PaymentsList";
import AddPayment from "./Admin/Payments/AddPayment";
import Invoice from "./Admin/Payments/Invoice";

import ScheduledBookingsList from "./Admin/Bookings/ScheduledBookingsList";
import AddScheduledBookings from "./Admin/Bookings/AddScheduledBookings";
import EditScheduledBookings from "./Admin/Bookings/EditScheduledBookings";

import PackagesList from "./Admin/Packages/PackagesList";
import AddPackage from "./Admin/Packages/AddPackage";
import EditPackage from "./Admin/Packages/EditPackage";

import CategoryList from "./Admin/Category/CategoryList";
import AddCategory from "./Admin/Category/AddCategory";
import EditCategory from "./Admin/Category/EditCategory";




import GalleryList from "./Admin/Gallery/GalleryList";
import AddGallery from "./Admin/Gallery/AddGallery";
import EditGallery from "./Admin/Gallery/EditGallery";
import HeroSlidersList from "./Admin/HeroSliders/HeroSlidersList";
import HeroSliderForm from "./Admin/HeroSliders/HeroSliderForm";
import HomepageStatisticsList from "./Admin/HomepageStatistics/HomepageStatisticsList";
import HomepageStatisticForm from "./Admin/HomepageStatistics/HomepageStatisticForm";

import NotificationsList from "./Admin/Notifications/NotificationsList";
import AddNotification from "./Admin/Notifications/AddNotification";
import EditNotification from "./Admin/Notifications/EditNotification";

import KeywordsList from "./Admin/Keywords/KeywordsList";
import AddKeyword from "./Admin/Keywords/AddKeyword";
import EditKeyword from "./Admin/Keywords/EditKeyword";

import UnansweredQuestions from "./Admin/Unanswered/UnansweredQuestions";
import ChatbotAnalytics from "./Admin/ChatbotAnalytics/ChatbotAnalytics";

import Quotation from "./Admin/GetQuotation/GetQuotation";

/* 🔥 FEATURED ROWS IMPORT */
import FeaturedRowsList from "./Admin/FeaturedRows/FeaturedRowsList";
import AddFeaturedRows from "./Admin/FeaturedRows/AddFeaturedRows";
import EditFeaturedRows from "./Admin/FeaturedRows/EditFeaturedRows";

import Footer from "./Components/Footer";

import Stats from "./Pages/AboutUs/Stats";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Contact from "./Pages/Contact/Contact";
import Career from "./Pages/Career/Career";
import { createPortal } from "react-dom";
import ScrollToTop from "./Components/ScrollToTop";
import api from "./Utils/api";
import { logoutAdmin, setAdminUser, setSession } from "./Utils/auth";
import { CustomAlertProvider, ThemeProvider, ThemeToggle } from "./Common";


import "./App.css";
import "./theme-overrides.css";

const ADMIN_SESSION_WARNING_TIME = 5 * 60 * 1000;

function AppWrapper() {
  

  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [continuingSession, setContinuingSession] = useState(false);

  useEffect(() => {
    const evaluateSession = () => {
      const token = localStorage.getItem("adminToken");
      const expiry = localStorage.getItem("tokenExpiry");

      if (!token || !expiry) {
        setShowSessionWarning(false);
        return;
      }

      const timeLeft = Number(expiry) - Date.now();
      if (timeLeft <= 0) {
        setShowModal(true);
        setShowSessionWarning(false);
        logoutAdmin();
        return;
      }

      if (timeLeft <= ADMIN_SESSION_WARNING_TIME) {
        setRemainingSeconds(Math.ceil(timeLeft / 1000));
        setShowSessionWarning(true);
      } else {
        setShowSessionWarning(false);
      }
    };

    evaluateSession();
    const interval = setInterval(evaluateSession, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginRedirect = () => {
    setShowModal(false);
    navigate("/");
  };

  const handleContinueSession = async () => {
    const refreshToken = localStorage.getItem("adminRefreshToken");
    const refreshExpiry = Number(localStorage.getItem("adminRefreshExpiry"));
    if (!refreshToken || !refreshExpiry || refreshExpiry <= Date.now()) {
      logoutAdmin();
      setShowSessionWarning(false);
      setShowModal(true);
      return;
    }

    setContinuingSession(true);
    try {
      const data = await api.post("/auth/refresh", { refreshToken });
      setSession(
        data.accessToken,
        new Date(data.accessTokenExpiresAt).getTime(),
        data.refreshToken,
        new Date(data.refreshTokenExpiresAt).getTime(),
      );
      setAdminUser(data.user);
      setShowSessionWarning(false);
      setRemainingSeconds(0);
    } catch {
      logoutAdmin();
      setShowSessionWarning(false);
      setShowModal(true);
    } finally {
      setContinuingSession(false);
    }
  };

  return (
    <>
<CustomAlertProvider />
<ScrollToTop />
      {/* SESSION MODAL */}
      {showSessionWarning && !showModal &&
  createPortal(
    <div className="session-modal" role="dialog" aria-modal="true" aria-labelledby="admin-session-warning-title">
      <div className="session-box">
        <h2 id="admin-session-warning-title">Session expiring soon</h2>
        <p>Your Admin session expires in {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}.</p>
        <button type="button" onClick={handleContinueSession} disabled={continuingSession}>
          {continuingSession ? "Continuing session…" : "Continue session"}
        </button>
      </div>
    </div>,
    document.body
  )
}
      {showModal &&
  createPortal(
    <div className="session-modal">
      <div className="session-box">
        <h2>Session Expired</h2>
        <button onClick={handleLoginRedirect}>
          Login Again
        </button>
      </div>
    </div>,
    document.body
  )
}

      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* CATEGORY */}
        <Route
          path="/admin/category/:code"
          element={<ProtectedRoute><ShowCategory /></ProtectedRoute>}
        />

        {/* TRANSPORT */}
        <Route
          path="/transport-slip/:tourId"
          element={<ProtectedRoute><TransportSlip /></ProtectedRoute>}
        />

        {/* USERS */}
        <Route
          path="/admin/users"
          element={<ProtectedRoute><UsersList /></ProtectedRoute>}
        />
        <Route
          path="/admin/users/edit/:id"
          element={<ProtectedRoute superAdminOnly><EditUser /></ProtectedRoute>}
        />
        <Route
          path="/admin/user-liked-packages"
          element={<ProtectedRoute><UserLikedPackages /></ProtectedRoute>}
        />
        <Route
          path="/admin/package-views"
          element={<ProtectedRoute><PackageViewAnalytics /></ProtectedRoute>}
        />
        <Route
          path="/admin/cache-management"
          element={<ProtectedRoute><CacheManagement /></ProtectedRoute>}
        />
        <Route
          path="/admin/administrator-accounts"
          element={<ProtectedRoute superAdminOnly><AdministratorAccounts /></ProtectedRoute>}
        />
        <Route
          path="/admin/occasion-popups"
          element={<ProtectedRoute superAdminOnly><OccasionPopups /></ProtectedRoute>}
        />
        <Route
          path="/admin/customer-submissions"
          element={<ProtectedRoute superAdminOnly><CustomerSubmissions /></ProtectedRoute>}
        />

        {/* ENQUIRY */}
        <Route
          path="/admin/enquiry"
          element={<ProtectedRoute><EnquiryList /></ProtectedRoute>}
        />

        <Route
          path="/admin/GetQuotation"
          element={<ProtectedRoute><Quotation /></ProtectedRoute>}
        />
       

        {/* PAYMENTS */}
        <Route
          path="/admin/payments"
          element={<ProtectedRoute><PaymentsList /></ProtectedRoute>}
        />
        <Route
          path="/admin/payments/new"
          element={<ProtectedRoute superAdminOnly><AddPayment /></ProtectedRoute>}
        />
        <Route
          path="/admin/payments/invoice/:bookingId"
          element={<ProtectedRoute><Invoice /></ProtectedRoute>}
        />

        {/* BOOKINGS */}
        <Route
          path="/admin/bookings"
          element={<ProtectedRoute><ScheduledBookingsList /></ProtectedRoute>}
        />
        <Route
          path="/admin/bookings/new"
          element={<ProtectedRoute><AddScheduledBookings /></ProtectedRoute>}
        />
        <Route
          path="/admin/bookings/edit/:id"
          element={<ProtectedRoute><EditScheduledBookings /></ProtectedRoute>}
        />

        {/* PACKAGES */}
        <Route
          path="/admin/packages"
          element={<ProtectedRoute><PackagesList /></ProtectedRoute>}
        />
        <Route
          path="/admin/packages/new"
          element={<ProtectedRoute superAdminOnly><AddPackage /></ProtectedRoute>}
        />
        <Route
          path="/admin/packages/edit/:id"
          element={<ProtectedRoute superAdminOnly><EditPackage /></ProtectedRoute>}
        />

        {/* CATEGORY */}
        <Route
          path="/admin/categories"
          element={<ProtectedRoute><CategoryList /></ProtectedRoute>}
        />
        <Route
          path="/admin/categories/add"
          element={<ProtectedRoute superAdminOnly><AddCategory /></ProtectedRoute>}
        />
        <Route
          path="/admin/categories/edit/:code"
          element={<ProtectedRoute superAdminOnly><EditCategory /></ProtectedRoute>}
        />

       

        {/* GALLERY */}
        <Route
          path="/admin/gallery"
          element={<ProtectedRoute><GalleryList /></ProtectedRoute>}
        />
        <Route
          path="/admin/gallery/add"
          element={<ProtectedRoute superAdminOnly><AddGallery /></ProtectedRoute>}
        />
        <Route
          path="/admin/gallery/edit/:id"
          element={<ProtectedRoute superAdminOnly><EditGallery /></ProtectedRoute>}
        />

        {/* HERO SLIDERS */}
        <Route
          path="/admin/hero-sliders"
          element={<ProtectedRoute><HeroSlidersList /></ProtectedRoute>}
        />
        <Route
          path="/admin/hero-sliders/add"
          element={<ProtectedRoute superAdminOnly><HeroSliderForm mode="add" /></ProtectedRoute>}
        />
        <Route
          path="/admin/hero-sliders/edit/:id"
          element={<ProtectedRoute superAdminOnly><HeroSliderForm mode="edit" /></ProtectedRoute>}
        />

        {/* HOMEPAGE STATISTICS */}
        <Route
          path="/admin/homepage-statistics"
          element={<ProtectedRoute><HomepageStatisticsList /></ProtectedRoute>}
        />
        <Route
          path="/admin/homepage-statistics/add"
          element={<ProtectedRoute superAdminOnly><HomepageStatisticForm mode="add" /></ProtectedRoute>}
        />
        <Route
          path="/admin/homepage-statistics/edit/:id"
          element={<ProtectedRoute superAdminOnly><HomepageStatisticForm mode="edit" /></ProtectedRoute>}
        />

        {/* NOTIFICATIONS */}
        <Route
          path="/admin/notifications"
          element={<ProtectedRoute><NotificationsList /></ProtectedRoute>}
        />
        <Route
          path="/admin/notifications/add"
          element={<ProtectedRoute superAdminOnly><AddNotification /></ProtectedRoute>}
        />
        <Route
          path="/admin/notifications/edit/:id"
          element={<ProtectedRoute superAdminOnly><EditNotification /></ProtectedRoute>}
        />

        {/* KEYWORDS */}
        <Route
          path="/admin/keywords"
          element={<ProtectedRoute><KeywordsList /></ProtectedRoute>}
        />
        <Route
          path="/admin/keywords/add"
          element={<ProtectedRoute superAdminOnly><AddKeyword /></ProtectedRoute>}
        />
        <Route
          path="/admin/keywords/edit/:id"
          element={<ProtectedRoute superAdminOnly><EditKeyword /></ProtectedRoute>}
        />

        {/* UNANSWERED */}
        <Route
          path="/admin/unanswered"
          element={<ProtectedRoute><UnansweredQuestions /></ProtectedRoute>}
        />

        <Route
          path="/admin/chat-analytics"
          element={<ProtectedRoute><ChatbotAnalytics /></ProtectedRoute>}
        />

        {/* 🔥 FEATURED ROWS */}
        <Route
          path="/admin/featured-rows"
          element={<ProtectedRoute><FeaturedRowsList /></ProtectedRoute>}
        />
        <Route
          path="/admin/featured-rows/add"
          element={<ProtectedRoute superAdminOnly><AddFeaturedRows /></ProtectedRoute>}
        />
        <Route
          path="/admin/featured-rows/edit/:id"
          element={<ProtectedRoute superAdminOnly><EditFeaturedRows /></ProtectedRoute>}
        />
        <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/careers" element={<Career />} />
      <Route path="/Stats" element={<Stats />} />

      </Routes>
      
       <Footer />
       <ThemeToggle />

    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
