import "./header.css";
import Navigation from "./navigation/Navigation";
import logoSibLions from "../../assets/logoSibLions.svg";

export default function Header({ currentPage, onPageChange, isUserLoggedIn }) {

  
  return (
    <div className="headerWrapper">
      <header className="header">
        <div className="headerLogo" onClick={() => onPageChange("events")}>
          <img
            src={logoSibLions}
            alt="Логотип SibLions"
            className="logoImage"
          />
        </div>

        <Navigation 
          currentPage={currentPage} 
          onPageChange={onPageChange}
          isUserLoggedIn={isUserLoggedIn}
        />
      </header>
    </div>
  );
}