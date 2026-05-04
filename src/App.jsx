import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAppStore } from "./store/useAppStore"; 

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

// Компонент-заглушка для неавторизованных пользователей
const GuestMessage = () => (
  <div className="accountGuestMessage">
    <p>Пожалуйста, авторизуйтесь для доступа к контенту.</p>
  </div>
);

function AppLayout({ children, isUserLoggedIn, requiresAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigating = useRef(false);
  
  const getPageFromPath = (pathname) => {
    // ✅ Игнорируем пути с eventId (содержат UUID)
    if (pathname.includes('/events/') && !pathname.endsWith('/events')) {
      return null; // Это детальная страница, не меняем currentPage
    }
    const page = pathname.replace(/^\/siblions\//, '').split('/')[0];
    return VALID_PAGES.includes(page) ? page : null;
  };

  const [currentPage, setCurrentPageState] = useState(() => {
    const urlPage = getPageFromPath(location.pathname);
    if (urlPage) return urlPage;
    const saved = localStorage.getItem(PAGE_KEY);
    return (saved && VALID_PAGES.includes(saved)) ? saved : "events";
  });

  useEffect(() => {
    const pageFromUrl = getPageFromPath(location.pathname);
    
    if (pageFromUrl && pageFromUrl !== currentPage && !isNavigating.current) {
      setCurrentPageState(pageFromUrl);
      localStorage.setItem(PAGE_KEY, pageFromUrl);
    } else if (!pageFromUrl && currentPage && !location.pathname.includes("/events/")) {
      isNavigating.current = true;
      navigate(`/${currentPage}`, { replace: true });
      setTimeout(() => { isNavigating.current = false; }, 100);
    }
  }, [location.pathname, currentPage, navigate]);

  const setCurrentPage = useCallback((newPage) => {
    if (VALID_PAGES.includes(newPage) && newPage !== currentPage) {
      isNavigating.current = true;
      setCurrentPageState(newPage);
      localStorage.setItem(PAGE_KEY, newPage);
      navigate(`/${newPage}`);
      setTimeout(() => { isNavigating.current = false; }, 100);
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
        {/* ПРОВЕРКА: Если страница требует авторизации, а юзер не вошел — показываем текст */}
        {requiresAuth && !isUserLoggedIn ? <GuestMessage /> : children}
      </main>
      <Footer onPageChange={setCurrentPage} />
    </div>
  );
}

function App() {
  const { authSlice, authSliceMethods } = useAppStore();

  useEffect(() => {
    const initAuth = async () => {
      const savedCode = sessionStorage.getItem('temp_oauth_code');
      const savedState = sessionStorage.getItem('temp_oauth_state');
      
      if (savedCode) {
        const query = `?code=${savedCode}&state=${savedState}`;
        try {
          await authSliceMethods.checkAuthentication(query);
        } finally {
          sessionStorage.removeItem('temp_oauth_code');
          sessionStorage.removeItem('temp_oauth_state');
        }
        return; 
      }
      await authSliceMethods.checkAuthentication();
    };
    
    initAuth();
  }, [authSliceMethods]);

  return (
    <BrowserRouter basename="/siblions">
      <Routes>
        {/* ✅ ВАЖНО: Сначала идут более конкретные пути */}
        
        {/* Детальная страница мероприятия (с UUID) - НЕ требует авторизации */}
        <Route 
          path="/events/:eventId" 
          element={
            <AppLayout isUserLoggedIn={authSlice.isAuthenticated} requiresAuth={false}>
              <EventDetailsPage />
            </AppLayout>
          } 
        />
        
        {/* Редирект с корня */}
        <Route path="/" element={<Navigate to="/events" replace />} />
        
        {/* Список мероприятий - ТРЕБУЕТ авторизации */}
        <Route 
          path="/events" 
          element={
            <AppLayout isUserLoggedIn={authSlice.isAuthenticated} requiresAuth={true}>
              <EventsPage />
            </AppLayout>
          } 
        />
        
        {/* Защищенные маршруты */}
        <Route 
          path="/orders" 
          element={
            <AppLayout isUserLoggedIn={authSlice.isAuthenticated} requiresAuth={true}>
              <OrdersPage />
            </AppLayout>
          } 
        />
        
        {/* Личный кабинет - НЕ требует авторизации (показывает форму входа) */}
        <Route 
          path="/personalAccount" 
          element={
            <AppLayout isUserLoggedIn={authSlice.isAuthenticated} requiresAuth={false}>
              <PersonalAccountPage />
            </AppLayout>
          } 
        />
        
        {/* Статистика - ТРЕБУЕТ авторизации */}
        <Route 
          path="/statistics" 
          element={
            <AppLayout isUserLoggedIn={authSlice.isAuthenticated} requiresAuth={true}>
              <StatisticsPage />
            </AppLayout>
          } 
        />
        
        {/* 404 - перенаправление на события */}
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;