import React, { useState, useEffect } from "react";
import "./eventDetails.css";

const PersonalAccountPage = ({ onAuthChange }) => { // Добавляем пропс onAuthChange
  const [userData, setUserData] = useState({
    fullName: "Иванов Иван Иванович",
    position: "Администратор",
    organization: "ТПУ",
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Загружаем данные пользователя (если есть в localStorage)
  useEffect(() => {
    const savedData = localStorage.getItem("userData");
    if (savedData) {
      setUserData(JSON.parse(savedData));
      setIsLoggedIn(true);
    }
  }, []);

  // Сохраняем изменения
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }, [userData, isLoggedIn]);

  const handleLogin = () => {
    const defaultUserData = {
      fullName: "Иванов Иван Иванович",
      position: "Администратор",
      organization: "ТПУ",
    };
    setUserData(defaultUserData);
    setIsLoggedIn(true);
    localStorage.setItem("userData", JSON.stringify(defaultUserData));
    if (onAuthChange) onAuthChange(true); // Уведомляем о входе
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserData({
      fullName: "",
      position: "",
      organization: "",
    });
    alert("Вы вышли из аккаунта");
    if (onAuthChange) onAuthChange(false); // Уведомляем о выходе
  };

  return (
    <section className="personalAccountPage">
      <div className="accountTitleSection">
        <h1 className="personalAccountTitle">Личный кабинет</h1>
        {!isLoggedIn ? (
          <button
            type="button"
            className="accountLoginBtn"
            onClick={handleLogin}
          >
            Войти в аккаунт
          </button>
        ) : (
          <button
            type="button"
            className="accountLogoutBtn"
            onClick={handleLogout}
          >
            Выйти из аккаунта
          </button>
        )}
      </div>

      {isLoggedIn && (
        <div className="accountInfoContainer">
          <div className="accountHeader">
            <h2 className="accountName">{userData.fullName}</h2>
            <div className="accountPosition">
              <p className="positionTitle">
                {userData.position} | {userData.organization}
              </p>
            </div>
          </div>

          <div className="accountSections">
            {/* Здесь могут быть другие секции */}
          </div>
        </div>
      )}
    </section>
  );
};

export default PersonalAccountPage;