import { memo } from "react";
import "./personalAccountButton.css";

// Иконки для авторизованного пользователя
import iconAuthorizedInactive from "/src/assets/profileButtoninactive.svg";
import iconAuthorizedActive from "/src/assets/profileButtonActive.svg";

// Иконки для неавторизованного пользователя
import iconNotAuthorizedInactive from "/src/assets/profileLoggedIn.svg";
import iconNotAuthorizedActive from "/src/assets/profileLoggedinactive.svg";

const PersonalAccountButton = memo(({ isActive, onClick, isUserLoggedIn }) => {
  let icon;
  let buttonClass;
  
  if (isUserLoggedIn) {
    if (isActive) {
      icon = iconAuthorizedActive;
      buttonClass = "personalAccountButton--active";
    } else {
      icon = iconAuthorizedInactive;
      buttonClass = "personalAccountButton--inactive";
    }
  } else {
    if (isActive) {
      icon = iconNotAuthorizedActive;
      buttonClass = "personalAccountButton--active";
    } else {
      icon = iconNotAuthorizedInactive;
      buttonClass = "personalAccountButton--inactive";
    }
  }
  
  const buttonClasses = `personalAccountButton ${buttonClass}`;
  
  const tooltipText = !isUserLoggedIn 
    ? "Войдите в аккаунт" 
    : "Личный кабинет";
  
  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={tooltipText}
    >
      <img src={icon} alt="Личный кабинет" />
    </button>
  );
});

PersonalAccountButton.displayName = 'PersonalAccountButton';

export default PersonalAccountButton;