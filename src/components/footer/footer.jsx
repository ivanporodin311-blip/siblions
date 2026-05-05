import "./footer.css";
import logoSibLions from "../../assets/logoSibLions.svg";
import InfoBlock from "/src/components/footer/infoBlock/infoBlock.jsx";

export default function Footer({ onPageChange }) {
  const handleLogoClick = () => {
    onPageChange("events");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      {/* Логотип по центру - перекрывает границу (как во втором варианте) */}
      <div className="footer__logo-wrapper">
        <div className="footer__logo-container">
          <img
            src={logoSibLions}
            alt="Логотип Сибирские Львы"
            className="footer__logo"
            onClick={handleLogoClick}
            role="button"
            aria-label="Перейти на главную"
          />
        </div>
      </div>

      <div className="footer__container">
        {/* Инфо-блок с навигацией */}
        <div className="footer__info-wrapper">
          <InfoBlock onPageChange={onPageChange} />
        </div>

        {/* Разделительная линия */}
        <div className="footer__divider" />

        {/* Копирайт */}
        <p className="footer__copyright">
          © 2026 Национальный исследовательский Томский политехнический университет
        </p>
      </div>
    </footer>
  );
}