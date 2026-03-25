import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import EventsPage from "./pages/events/events";
import OrdersPage from "./pages/orders/orders";
import PersonalAccountPage from "./pages/personalAccount/personalAccount";
import StatisticsPage from "./pages/statistics/statistics";
import EventDetailsPage from "./pages/events/EventDetailsPage";
import "./App.css";

const PAGE_KEY = "appCurrentPage";
const VALID_PAGES = ["events", "orders", "personalAccount", "statistics"];

function AppLayout({ children, isUserLoggedIn, onAuthChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigating = useRef(false);
  
  const getPageFromPath = (pathname) => {
    const page = pathname.slice(1);
    return VALID_PAGES.includes(page) ? page : null;
  };

  const [currentPage, setCurrentPageState] = useState(() => {
    const urlPage = getPageFromPath(location.pathname);
    if (urlPage) {
      return urlPage;
    }
    const saved = localStorage.getItem(PAGE_KEY);
    if (saved && VALID_PAGES.includes(saved)) {
      return saved;
    }
    return "events";
  });

  // Синхронизация URL с состоянием
  useEffect(() => {
    const pageFromUrl = getPageFromPath(location.pathname);
    
    if (pageFromUrl && pageFromUrl !== currentPage && !isNavigating.current) {
      setCurrentPageState(pageFromUrl);
      localStorage.setItem(PAGE_KEY, pageFromUrl);
    } else if (!pageFromUrl && currentPage && !location.pathname.includes("/events/")) {
      isNavigating.current = true;
      navigate(`/${currentPage}`, { replace: true });
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    }
  }, [location.pathname, currentPage, navigate]);

  const setCurrentPage = useCallback((newPage) => {
    if (VALID_PAGES.includes(newPage) && newPage !== currentPage) {
      isNavigating.current = true;
      setCurrentPageState(newPage);
      localStorage.setItem(PAGE_KEY, newPage);
      navigate(`/${newPage}`);
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    }
  }, [currentPage, navigate]);

  return (
    <div className="app">
      <Header 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        isUserLoggedIn={isUserLoggedIn}
      />
      <main className="app__content">
        {children}
      </main>
      <Footer onPageChange={setCurrentPage} />
    </div>
  );
}

function App() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => {
    return localStorage.getItem("userData") !== null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsUserLoggedIn(localStorage.getItem("userData") !== null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAuthChange = useCallback((isLoggedIn) => {
    setIsUserLoggedIn(isLoggedIn);
  }, []);

  return (
    <BrowserRouter basename="/siblions">
      <Routes>
        <Route 
          path="/events/:eventId" 
          element={
            <AppLayout 
              isUserLoggedIn={isUserLoggedIn}
              onAuthChange={handleAuthChange}
            >
              <EventDetailsPage />
            </AppLayout>
          } 
        />
        
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route 
          path="/events" 
          element={
            <AppLayout 
              isUserLoggedIn={isUserLoggedIn}
              onAuthChange={handleAuthChange}
            >
              <EventsPage />
            </AppLayout>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <AppLayout 
              isUserLoggedIn={isUserLoggedIn}
              onAuthChange={handleAuthChange}
            >
              <OrdersPage />
            </AppLayout>
          } 
        />
        <Route 
          path="/personalAccount" 
          element={
            <AppLayout 
              isUserLoggedIn={isUserLoggedIn}
              onAuthChange={handleAuthChange}
            >
              <PersonalAccountPage onAuthChange={handleAuthChange} />
            </AppLayout>
          } 
        />
        <Route 
          path="/statistics" 
          element={
            <AppLayout 
              isUserLoggedIn={isUserLoggedIn}
              onAuthChange={handleAuthChange}
            >
              <StatisticsPage />
            </AppLayout>
          } 
        />
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;