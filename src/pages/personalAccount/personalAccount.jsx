import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { oauthRedirect } from "../../Services/authHandler";
import "./personalAccount.css";

const PersonalAccountPage = () => {
  const navigate = useNavigate();
  const { authSlice, authSliceMethods } = useAppStore();

  console.log('🔍 Рендер PersonalAccountPage');
  console.log('🔍 isAuthenticated:', authSlice.isAuthenticated);
  console.log('🔍 isLoading:', authSlice.isLoading);
  
  const userData = useMemo(() => {
    const data = authSliceMethods.getUserData();
    // Данные приходят в формате { message: "...", user: {...} }
    // Поэтому берем data.user
    return data?.user || data;
  }, [authSlice.user, authSliceMethods]);

  // Формируем полное ФИО из полей firstName, lastName, middleName
  const getFullName = (user) => {
    if (!user) return "Пользователь ТПУ";
    
    const parts = [];
    if (user.lastName) parts.push(user.lastName);
    if (user.firstName) parts.push(user.firstName);
    if (user.middleName) parts.push(user.middleName);
    
    return parts.length > 0 ? parts.join(" ") : "Пользователь ТПУ";
  };

  // Получаем русское название роли
  const getRoleName = (role) => {
    const roles = {
      'student': 'Студент',
      'teacher': 'Преподаватель',
      'admin': 'Администратор',
    };
    return roles[role] || role || "Роль не указана";
  };

  const handleLogin = () => {
    console.log("Кнопка входа нажата!");
    oauthRedirect();
  };

  const handleLogout = () => {
    console.log('🖱️ КНОПКА ВЫХОДА НАЖАТА 🖱️');
    (async () => {
      try {
        console.log('👉 Вызываю authSliceMethods.logout()');
        await authSliceMethods.logout();
        console.log('👉 logout завершён, делаю navigate');
        navigate("/events");
      } catch (error) {
        console.error("❌ Ошибка при выходе:", error);
      }
    })();
  };

  if (!authSlice.isAuthenticated) {
    return (
      <section className="personalAccountPage">
        <div className="accountTitleSection">
          <h1 className="personalAccountTitle">Личный кабинет</h1>
          <button
            type="button"
            className="accountLoginBtn"
            onClick={handleLogin}
            disabled={authSlice.isLoading}
          >
            {authSlice.isLoading ? "Загрузка..." : "Войти через ТПУ"}
          </button>
        </div>
        <div className="accountGuestMessage">
          <p>Пожалуйста, авторизуйтесь для доступа к контенту.</p>
        </div>
        {authSlice.error && (
          <div className="authError">
            Ошибка: {authSlice.error}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="personalAccountPage">
      <div className="accountTitleSection">
        <h1 className="personalAccountTitle">Личный кабинет</h1>
        <button
          type="button"
          className="accountLogoutBtn"
          onClick={handleLogout}
          disabled={authSlice.isLoading}
        >
          {authSlice.isLoading ? "Выход..." : "Выйти из аккаунта"}
        </button>
      </div>

      {userData ? (
        <div className="accountInfoContainer">
          <div className="accountHeader">
            <h2 className="accountName">{getFullName(userData)}</h2>
            <div className="accountPosition">
              <p className="positionTitle">
                {getRoleName(userData.role)}
              </p>
            </div>
          </div>
          
          {/* Черта и почта под ней */}
          
          <div className="accountSections">
            <p className="accountEmail">{userData.email}</p>
          </div>
        </div>
      ) : (
        <div className="accountGuestMessage">
          <p>Загрузка данных...</p>
        </div>
      )}
      
      {authSlice.error && (
        <div className="authError">
          Ошибка: {authSlice.error}
        </div>
      )}
    </section>
  );
};

export default PersonalAccountPage;