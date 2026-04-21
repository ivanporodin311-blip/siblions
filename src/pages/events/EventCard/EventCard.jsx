import React from "react";
import { useNavigate } from "react-router-dom";
import "./EventCard.css";
import changeButtonIcon from "../../../assets/changeButtonSmall.svg";

const EventCard = ({ event, onEdit }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "Дата не указана";
    
    const date = new Date(dateString);
    
    // Проверка на валидность
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "Дата не указана";
    }
    
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return "";
    }
    
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(event);
  };

  // Получаем дату из правильного поля (startDate)
  const eventDate = event.startDate || event.date;
  const eventTime = event.startDate || event.time;

  // Форматируем полную дату и время для подсказки
  const fullDate = formatDate(eventDate);
  const fullTime = formatTime(eventTime);
  
  // Формируем полную подсказку для места
  const locationTooltip = event.location || "Место не указано";
  
  // Формируем полную подсказку для даты и времени
  const dateTimeTooltip = eventTime 
    ? `${fullDate} в ${fullTime}`
    : fullDate;

  return (
    <div className="eventCard" onClick={handleCardClick}>
      <div className="ag-courses-item_bg"></div>
      
      <div className="eventCard__header">
        <div className="eventCard__titleSection">
          <h1 className="eventCard__title" title={event.title}>
            {event.title}
          </h1>
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
            <span 
              className="eventCard__location" 
              title={locationTooltip}
            >
              {event.location}
            </span>
            <span className="eventCard__separator"> | </span>
            <span 
              className="eventCard__date" 
              title={fullDate}
            >
              {formatDate(eventDate)}
            </span>
            {eventTime && (
              <>
                <span className="eventCard__separator"> | </span>
                <span 
                  className="eventCard__time" 
                  title={fullTime}
                >
                  {formatTime(eventTime)}
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