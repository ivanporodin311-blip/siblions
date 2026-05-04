import React, { useEffect, useRef, useState } from "react";
import "./modalAddWindow.css";
import CreateButton from "./buttons/createButton.jsx";
import UpdateButton from "./buttons/updateButton.jsx";
import DeleteButton from "./buttons/deleteButton.jsx";
import CustomSelect from "./CustomSelect.jsx";

const SPORT_TYPES = [
  "Альпинизм", "Бадминтон", "Баскетбол", "Баскетбол 3x3", "Бокс", "Боулинг",
  "Велоспорт", "Волейбол", "Гандбол", "Гиревой спорт", "Гребля", "Дартс",
  "Джиу джитсу", "Кёрлинг", "Киберспорт", "Микрофутзал", "Настольный теннис",
  "Образовательное мероприятие", "Пауэрлифтинг", "Перетягивание каната",
  "Плавание", "Пулевая стрельба", "Самбо", "Скалолазание",
  "Спортивное ориентирование", "Спортивное программирование",
  "Спортивный туризм", "Стрельба из лука", "Теннис", "Тхэквондо",
  "Тяжелая атлетика", "Фиджитал-спорт", "Флаинг диск", "Футбол",
  "Футзал", "Шахматы", "Шашки", "Эстафета ГТО",
];

const EVENT_LEVELS = [
  "Общежитие", "Инженерная школа", "Университет",
  "Регион", "Федеральный округ", "Россия",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 МБ

const getMaxEventDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().slice(0, 10);
};

const ModalAddWindow = ({
  onClose,
  onSubmit,
  onDelete,
  eventToEdit = null,
  mode = "create",
}) => {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const descriptionRef = useRef(null);
  const tasksRef = useRef(null);
  const organizersRef = useRef(null);

  const resizeTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(111, el.scrollHeight) + "px";
  };

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    registrationDeadline: "",
    registrationDeadlineTime: "",
    sportType: "",
    eventLevel: "",
    description: "",
    tasks: "",
    organizers: "",
    points: "",
    attachedFileName: "",
    attachedFileData: "",
  });

  useEffect(() => {
    if (mode === "edit" && eventToEdit) {
      setFormData({
        title: eventToEdit.title || "",
        location: eventToEdit.location || "",
        date: eventToEdit.startDate ? eventToEdit.startDate.slice(0, 10) : "",
        time: eventToEdit.startDate ? eventToEdit.startDate.slice(11, 16) : "",
        endDate: eventToEdit.endDate ? eventToEdit.endDate.slice(0, 10) : "",
        endTime: eventToEdit.endDate ? eventToEdit.endDate.slice(11, 16) : "23:59",
        registrationDeadline: eventToEdit.registrationDeadline ? eventToEdit.registrationDeadline.slice(0, 10) : "",
        registrationDeadlineTime: eventToEdit.registrationDeadline ? eventToEdit.registrationDeadline.slice(11, 16) : "23:59",
        sportType: eventToEdit.eventType || "",
        eventLevel: eventToEdit.eventLevel || "",
        description: eventToEdit.description || "",
        tasks: eventToEdit.tasks || "",
        organizers: eventToEdit.organizers || "",
        points: eventToEdit.participantPoints || "",
        attachedFileName: eventToEdit.attachedFileName || "",
        attachedFileData: eventToEdit.attachedFileData || "",
      });
    }
  }, [mode, eventToEdit]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      [descriptionRef.current, tasksRef.current, organizersRef.current].forEach(
        resizeTextarea
      );
    });
    return () => cancelAnimationFrame(timer);
  }, [formData.description, formData.tasks, formData.organizers]);

  const fileDialogOpenRef = useRef(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const onWindowBlur = () => {
      if (fileDialogOpenRef.current && formRef.current) {
        scrollPosRef.current = formRef.current.scrollTop;
      }
    };
    const onWindowFocus = () => {
      if (fileDialogOpenRef.current) {
        if (formRef.current) {
          formRef.current.scrollTop = scrollPosRef.current;
        }
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.scrollTop = scrollPosRef.current;
          }
          fileDialogOpenRef.current = false;
        }, 100);
      }
    };
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, []);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);
  
  const handleOverlayClick = (e) => {
    if (fileDialogOpenRef.current) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (e.target.tagName === "TEXTAREA") {
      resizeTextarea(e.target);
    }
  };

  const [fileError, setFileError] = useState("");

  const handleFileClick = () => {
    fileDialogOpenRef.current = true;
    if (formRef.current) {
      scrollPosRef.current = formRef.current.scrollTop;
    }
  };

  const handleFileChange = (e) => {
    fileDialogOpenRef.current = false;
    const file = e.target.files?.[0];
    
    if (!file) {
      setFileError("");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("Файл слишком большой. Максимум 2 МБ.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFormData(p => ({ ...p, attachedFileName: "", attachedFileData: "" }));
      return;
    }

    setFileError("");
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((p) => ({
        ...p,
        attachedFileName: file.name,
        attachedFileData: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFormData((p) => ({ ...p, attachedFileName: "", attachedFileData: "" }));
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ ИСПРАВЛЕННАЯ handleSubmit - можно указывать все даты
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Создаем ISO дату начала
    let startDate = null;
    if (formData.date) {
      const startTime = formData.time || "00:00";
      startDate = new Date(`${formData.date}T${startTime}:00`).toISOString();
    }
    
    // Создаем ISO дату окончания
    let endDate = null;
    if (formData.endDate) {
      const endTime = formData.endTime || "23:59";
      endDate = new Date(`${formData.endDate}T${endTime}:59`).toISOString();
    } else if (formData.date) {
      // Если endDate не указан, используем дату начала
      const endTime = formData.endTime || "23:59";
      endDate = new Date(`${formData.date}T${endTime}:59`).toISOString();
    }
    
    // Создаем ISO дату дедлайна регистрации
    let registrationDeadline = null;
    if (formData.registrationDeadline) {
      const deadlineTime = formData.registrationDeadlineTime || "23:59";
      registrationDeadline = new Date(`${formData.registrationDeadline}T${deadlineTime}:59`).toISOString();
    }
    
    // Формируем данные для сервера (только с валидными значениями)
    const submitData = {
      title: formData.title,
      description: formData.description || "",
      eventType: formData.sportType || "sport",
      startDate: startDate,
      endDate: endDate,
      participantPoints: parseInt(formData.points) || 0,
      fanPoints: 0,
      maxParticipants: 0,
      location: formData.location || "Не указано",
      status: "active",
    };
    
    // Добавляем registrationDeadline только если он указан
    if (registrationDeadline) {
      submitData.registrationDeadline = registrationDeadline;
    }
    
    // Добавляем опциональные поля только если они заполнены
    if (formData.eventLevel) submitData.eventLevel = formData.eventLevel;
    if (formData.tasks) submitData.tasks = formData.tasks;
    if (formData.organizers) submitData.organizers = formData.organizers;
    
    console.log("📦 Отправляем на сервер:", submitData);
    onSubmit(submitData);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Вы уверены, что хотите удалить это мероприятие?")) {
      onDelete();
      onClose();
    }
  };

  return (
    <div className="modalOverlay" onClick={handleOverlayClick}>
      <div 
        className="modalWindow" 
        ref={modalRef} 
        onClick={(e) => e.stopPropagation()}
      >
        <form className="modalContent" ref={formRef} onSubmit={handleSubmit}>
          {/* 1. Название мероприятия */}
          <div className="formGroup">
            <label className="formLabel required">
              Наименование мероприятия
            </label>
            <input
              name="title"
              placeholder="Введите название мероприятия"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* 2. Вид спорта */}
          <div className="formGroup">
            <label className="formLabel">Вид спорта</label>
            <CustomSelect
              name="sportType"
              value={formData.sportType}
              onChange={handleChange}
              options={SPORT_TYPES}
              placeholder="Выберите вид спорта"
            />
          </div>

          {/* 3. Уровень мероприятия */}
          <div className="formGroup">
            <label className="formLabel required">Уровень мероприятия</label>
            <CustomSelect
              name="eventLevel"
              value={formData.eventLevel}
              onChange={handleChange}
              options={EVENT_LEVELS}
              placeholder="Выберите уровень"
              required
            />
          </div>

          {/* 4. Дата проведения (начало) */}
          <div className="formGroup">
            <label className="formLabel required">Дата проведения (начало)</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={getMaxEventDate()}
              required
            />
          </div>

          {/* 5. Время проведения (начало) */}
          <div className="formGroup">
            <label className="formLabel">Время проведения (начало)</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
            />
          </div>

          {/* 6. Дата окончания */}
          <div className="formGroup">
            <label className="formLabel">Дата окончания</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.date}
              max={getMaxEventDate()}
            />
          </div>

          {/* 7. Время окончания */}
          <div className="formGroup">
            <label className="formLabel">Время окончания</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              placeholder="23:59"
            />
          </div>

          {/* 8. Дедлайн регистрации (дата) */}
          <div className="formGroup">
            <label className="formLabel">Дедлайн регистрации (дата)</label>
            <input
              type="date"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleChange}
              max={formData.date}
            />
          </div>

          {/* 9. Дедлайн регистрации (время) */}
          <div className="formGroup">
            <label className="formLabel">Дедлайн регистрации (время)</label>
            <input
              type="time"
              name="registrationDeadlineTime"
              value={formData.registrationDeadlineTime}
              onChange={handleChange}
              placeholder="23:59"
            />
          </div>

          {/* 10. Адрес проведения */}
          <div className="formGroup">
            <label className="formLabel">Адрес проведения</label>
            <input
              name="location"
              placeholder="Введите адрес проведения"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {/* 11. Описание мероприятия */}
          <div className="formGroup">
            <label className="formLabel">Описание мероприятия</label>
            <textarea
              ref={descriptionRef}
              name="description"
              placeholder="Введите описание мероприятия"
              value={formData.description}
              onChange={handleChange}
              rows={1}
            />
          </div>

          {/* 12. Задачи на мероприятие */}
          <div className="formGroup">
            <label className="formLabel">Задачи на мероприятие</label>
            <textarea
              ref={tasksRef}
              name="tasks"
              placeholder="Опишите задачи на мероприятие"
              value={formData.tasks}
              onChange={handleChange}
              rows={1}
            />
          </div>

          {/* 13. Организаторы */}
          <div className="formGroup">
            <label className="formLabel">Организаторы</label>
            <textarea
              ref={organizersRef}
              name="organizers"
              placeholder="Введите организаторов мероприятия"
              value={formData.organizers}
              onChange={handleChange}
              rows={1}
            />
          </div>

          {/* 14. Количество баллов */}
          <div className="formGroup">
            <label className="formLabel required">
              Количество баллов за мероприятие
            </label>
            <input
              type="number"
              name="points"
              placeholder="Введите количество баллов"
              value={formData.points}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          {/* Прикрепить документ */}
          <div className="formGroup">
            <label className="formLabel">Прикрепить документ</label>
            <div className="formFileRow">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="formFileInput"
                id="event-attachment"
              />
              <label
                htmlFor="event-attachment"
                className={`formFileLabel ${formData.attachedFileName ? "formFileLabel--hasFile" : ""}`}
                onClick={handleFileClick}
              >
                {formData.attachedFileName || "Выберите файл"}
              </label>
              
              {formData.attachedFileName && (
                <button
                  type="button"
                  className="formFileRemove"
                  onClick={handleRemoveFile}
                  aria-label="Удалить файл"
                >
                  Удалить
                </button>
              )}
            </div>
            <span className="formFileHint">Макс. 2 МБ. PDF, DOC, DOCX, TXT.</span>
            {fileError && <span className="formFileError">{fileError}</span>}
          </div>

          {/* Кнопки */}
          <div
            className={`modalButtonsWrapper ${
              mode === "edit" ? "two-buttons" : "one-button"
            }`}
          >
            {mode === "create" ? (
              <CreateButton type="submit">Создать</CreateButton>
            ) : (
              <>
                <UpdateButton type="submit">Сохранить</UpdateButton>
                <DeleteButton type="button" onClick={handleDelete}>
                  Удалить
                </DeleteButton>
              </>
            )}
          </div>

          <div className="modalBottomBorder" />
        </form>
      </div>
    </div>
  );
};

export default ModalAddWindow;