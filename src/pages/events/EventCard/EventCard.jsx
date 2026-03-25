import React from "react";
import { useNavigate } from "react-router-dom";
import "./EventCard.css";
import changeButtonIcon from "../../../assets/changeButtonSmall.svg";

const EventCard = ({ event, onEdit }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(event);
  };

  return (
    <div className="eventCard" onClick={handleCardClick}>
      <div className="ag-courses-item_bg"></div>
      
      <div className="eventCard__header">
        <div className="eventCard__titleSection">
          <h1 className="eventCard__title">{event.title}</h1>
          <button
            className="eventCard__editIconButton"
            onClick={handleEditClick}
            aria-label="Редактировать мероприятие"
          >
            <img src={changeButtonIcon} alt="Редактировать" />
          </button>
        </div>

        <div className="eventCard__headerInfo">
          <div className="eventCard__locationDate">
            <span className="eventCard__location">{event.location}</span>
            <span className="eventCard__separator"> | </span>
            <span className="eventCard__date">{formatDate(event.date)}</span>
            {event.time && (
              <>
                <span className="eventCard__separator"> | </span>
                <span className="eventCard__time">
                  {formatTime(event.time)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;