import "./navigation.css";
import EventsButton from "./navButton/eventsButton/eventsButton";
import OrdersButton from "./navButton/ordersButton/ordersButton";
import PersonalAccountButton from "./navButton/personalAccountButton/personalAccountButton";
import StatisticsButton from "./navButton/statisticsButton/statisticsButton";

export default function Navigation({ currentPage, onPageChange, isUserLoggedIn }) {

  
  return (
    <nav className="navigation" role="navigation" aria-label="Основное меню">
      <ul className="navigationList">
        <li className="navigationItem">
          <EventsButton
            isActive={currentPage === "events"}
            onClick={() => onPageChange("events")}
          />
        </li>

        <li className="navigationItem">
          <OrdersButton
            isActive={currentPage === "orders"}
            onClick={() => onPageChange("orders")}
          />
        </li>

        <li className="navigationItem">
          <StatisticsButton
            isActive={currentPage === "statistics"}
            onClick={() => onPageChange("statistics")}
          />
        </li>

        <li className="navigationItem">
          <PersonalAccountButton
            isActive={currentPage === "personalAccount"}
            onClick={() => onPageChange("personalAccount")}
            isUserLoggedIn={isUserLoggedIn}
          />
        </li>
      </ul>
    </nav>
  );
}