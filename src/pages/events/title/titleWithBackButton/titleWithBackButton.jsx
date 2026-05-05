// title/titleWithBackButton/titleWithBackButton.jsx
import React from "react";
import "./titleWithBackButton.css";

function TitleWithBackButton({ title, onBackClick }) {
  return (
    <div className="titleWithBackButton">
      <button className="backButton" onClick={onBackClick}>
        ← Назад
      </button>
      <h1 className="pageTitle">{title}</h1>
    </div>
  );
}

export default TitleWithBackButton;