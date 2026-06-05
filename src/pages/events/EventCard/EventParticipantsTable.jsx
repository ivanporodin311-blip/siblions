import React, { useState, useRef, useEffect, useMemo } from "react";
import "./EventParticipantsTable.css";

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14.5 1.62132C14.8978 1.2235 15.4374 1 16 1C16.2786 1 16.5544 1.05487 16.8118 1.16148C17.0692 1.26808 17.303 1.42434 17.5 1.62132C17.697 1.8183 17.8532 2.05216 17.9598 2.30953C18.0665 2.5669 18.1213 2.84274 18.1213 3.12132C18.1213 3.3999 18.0665 3.67574 17.9598 3.93311C17.8532 4.19048 17.697 4.42434 17.5 4.62132L5 17.1213L1 18.1213L2 14.1213L14.5 1.62132Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EventParticipantsTable = ({
  participants,
  onPointsChange,
  participantTotals,
  onEditParticipant,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", group: "", school: "" });
  const editingRowRef = useRef(null);
  
  // Отдельное состояние для баллов каждого участника
  const [pointsMap, setPointsMap] = useState(() => {
    const map = {};
    participants.forEach(p => {
      map[p.id] = p.points || 0;
    });
    return map;
  });

  // Обновляем pointsMap при изменении списка участников
  useEffect(() => {
    setPointsMap(prev => {
      const newMap = { ...prev };
      participants.forEach(p => {
        if (newMap[p.id] === undefined) {
          newMap[p.id] = p.points || 0;
        }
      });
      return newMap;
    });
  }, [participants]);

  const handleEditClick = (participant) => {
    if (editingId === participant.id) {
      if (onEditParticipant) onEditParticipant(participant.id, editForm);
      setEditingId(null);
      return;
    }
    setEditingId(participant.id);
    setEditForm({
      name: participant.name,
      group: participant.group || "",
      school: participant.school || "",
    });
  };

  useEffect(() => {
    if (!editingId) return;
    const handleMouseDown = (e) => {
      if (editingRowRef.current && !editingRowRef.current.contains(e.target)) {
        if (onEditParticipant) onEditParticipant(editingId, editForm);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [editingId, editForm, onEditParticipant]);

  // Обработчик изменения баллов
  const handlePointsInputChange = (participantId, value) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setPointsMap(prev => ({ ...prev, [participantId]: num }));
    onPointsChange(participantId, num);
  };

  return (
    <div className="participantsTable">
      <div className="tableHeader">
        <div className="tableRow">
          <div className="tableCell edit"></div>
          <div className="tableCell number">№</div>
          <div className="tableCell name">ФИО</div>
          <div className="tableCell points">Баллы</div>
          <div className="tableCell total">Общие баллы</div>
        </div>
      </div>

      <div className="tableBody">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            ref={editingId === participant.id ? editingRowRef : null}
            className={`tableRow ${editingId === participant.id ? "editing" : ""}`}
          >
            <div className="tableCell edit">
              <button
                type="button"
                className="tableActionBtn tableActionBtn--edit"
                onClick={() => handleEditClick(participant)}
                aria-label="Редактировать участника"
                title="Редактировать"
              >
                <EditIcon />
              </button>
            </div>
            <div className="tableCell number">{index + 1}</div>
            {editingId === participant.id ? (
              <>
                <div className="tableCell name">
                  <input
                    type="text"
                    className="tableEditInput"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ФИО"
                  />
                </div>
                <div className="tableCell points">
                  <input
                    type="number"
                    min={0}
                    value={pointsMap[participant.id] || ""}
                    onChange={(e) => handlePointsInputChange(participant.id, e.target.value)}
                    className="pointsInput"
                    placeholder="0"
                  />
                </div>
                <div className="tableCell total">
                  {participantTotals?.[participant.id] ?? 0}
                </div>
              </>
            ) : (
              <>
                <div className="tableCell name">{participant.name}</div>
                <div className="tableCell points">
                  <input
                    type="number"
                    min={0}
                    value={pointsMap[participant.id] || ""}
                    onChange={(e) => handlePointsInputChange(participant.id, e.target.value)}
                    className="pointsInput"
                    placeholder="0"
                  />
                </div>
                <div className="tableCell total">
                  {participantTotals?.[participant.id] ?? 0}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventParticipantsTable;