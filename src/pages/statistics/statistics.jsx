import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import useEventStore from "../../stores/eventStore";
import "./statistics.css";

const STATISTICS_DATE_KEY = "statisticsDateRange";

const getDefaultDateRange = () => {
  const saved = localStorage.getItem(STATISTICS_DATE_KEY);
  if (saved) {
    try {
      const { from, to } = JSON.parse(saved);
      if (from && to) return { from, to };
    } catch {}
  }
  const now = new Date();
  const start = new Date(now.getFullYear() - 5, 0, 1);
  const end = new Date(now.getFullYear() + 1, 11, 31);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

const STATUS_LABELS = {
  new: "Новый",
  processing: "В обработке",
  assembled: "Собран",
  ready: "Готов к выдаче",
  received: "Получен",
  cancelled: "Отменен",
};

const StatisticsPage = () => {
  const defaultRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const reportRef = useRef(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [eventsWithParticipants, setEventsWithParticipants] = useState([]);

  const store = useEventStore();
  const events = store.events || [];
  const fetchEvents = store.fetchEvents;
  const fetchEventParticipants = store.fetchEventParticipants;
  const eventsLoading = store.loading || false;
  const [localOrders, setLocalOrders] = useState([]);

  // Загружаем участников для всех мероприятий
  const loadAllParticipants = useCallback(async () => {
    if (!events.length || !fetchEventParticipants) {
      console.log('Нет мероприятий или функции загрузки');
      return;
    }
    
    console.log('📊 Загрузка участников для', events.length, 'мероприятий...');
    setLoadingParticipants(true);
    const eventsData = [];
    
    for (const event of events) {
      const eventId = event.uuid || event.id;
      console.log(`📡 Загружаем участников для: ${event.title} (${eventId})`);
      
      try {
        const response = await fetchEventParticipants(eventId);
        
        let persons = [];
        if (response?.success && response.persons) {
          persons = response.persons;
        } else if (response?.persons) {
          persons = response.persons;
        } else if (Array.isArray(response)) {
          persons = response;
        }
        
        console.log(`✅ Найдено участников: ${persons.length}`);
        console.log('Детали участников:', persons.map(p => ({ id: p.id, role: p.role, name: p.username })));
        
        eventsData.push({
          ...event,
          participants: persons,
          participantsCount: persons.filter(p => p.role === 'participant').length,
          fansCount: persons.filter(p => p.role === 'fan').length,
          totalCount: persons.length
        });
      } catch (error) {
        console.error(`Ошибка для ${event.title}:`, error);
        eventsData.push({
          ...event,
          participants: [],
          participantsCount: 0,
          fansCount: 0,
          totalCount: 0
        });
      }
    }
    
    console.log('📊 Всего загружено мероприятий:', eventsData.length);
    console.log('📊 Данные с участниками:', eventsData.map(e => ({ 
      title: e.title, 
      participantsCount: e.participantsCount,
      fansCount: e.fansCount 
    })));
    
    setEventsWithParticipants([...eventsData]);
    setLoadingParticipants(false);
  }, [events, fetchEventParticipants]);

  useEffect(() => {
    loadAllParticipants();
  }, [loadAllParticipants]);

  useEffect(() => {
    const loadData = async () => {
      console.log('📊 Загрузка данных...');
      if (fetchEvents) {
        await fetchEvents(1, 1000);
      }
      
      const ordersJson = localStorage.getItem("ordersData") || localStorage.getItem("orders");
      if (ordersJson) {
        try {
          const parsed = JSON.parse(ordersJson);
          setLocalOrders(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error('Ошибка парсинга заказов:', e);
        }
      }
    };
    loadData();
  }, [fetchEvents]);

  const saveDateRange = (from, to) => {
    localStorage.setItem(STATISTICS_DATE_KEY, JSON.stringify({ from, to }));
  };

  const reportData = useMemo(() => {
    try {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);

      console.log('Фильтр дат:', { dateFrom, dateTo, from, to });
      console.log('Всего мероприятий с участниками:', eventsWithParticipants.length);
      console.log('Мероприятия:', eventsWithParticipants.map(e => ({ 
        title: e.title, 
        startDate: e.startDate,
        participantsCount: e.participantsCount 
      })));

      const eventsInPeriod = eventsWithParticipants.filter((event) => {
        if (!event.startDate) {
          console.log(`Нет startDate у ${event.title}, включаем`);
          return true;
        }
        const d = new Date(event.startDate);
        const inPeriod = d >= from && d <= to;
        console.log(`${event.title}: дата ${event.startDate} - ${inPeriod ? 'в периоде' : 'не в периоде'}`);
        return inPeriod;
      });

      console.log('📊 Мероприятий в периоде:', eventsInPeriod.length);
      console.log('Детали мероприятий в периоде:', eventsInPeriod.map(e => ({ 
        title: e.title, 
        participantsCount: e.participantsCount,
        fansCount: e.fansCount 
      })));

      let totalParticipantsCount = 0;
      let totalFansCount = 0;
      const uniqueParticipants = new Set();
      const uniqueFans = new Set();

      eventsInPeriod.forEach((event) => {
        totalParticipantsCount += event.participantsCount || 0;
        totalFansCount += event.fansCount || 0;
        
        (event.participants || []).forEach(p => {
          if (p.id && p.role === 'participant') uniqueParticipants.add(p.id);
          if (p.id && p.role === 'fan') uniqueFans.add(p.id);
        });
      });

      console.log('Суммы участников:', { totalParticipantsCount, totalFansCount });

      const monthData = {};
      eventsInPeriod.forEach((event) => {
        let d;
        if (event.startDate) {
          d = new Date(event.startDate);
        } else {
          d = new Date();
        }
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthData[key]) {
          monthData[key] = {
            month: d.toLocaleDateString("ru-RU", { month: "short", year: "numeric" }),
            events: 0,
            participants: 0,
            fans: 0,
          };
        }
        monthData[key].events += 1;
        monthData[key].participants += event.participantsCount || 0;
        monthData[key].fans += event.fansCount || 0;
      });

      const chartData = Object.entries(monthData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);

      const result = {
        totalEvents: eventsInPeriod.length,
        totalParticipants: totalParticipantsCount,
        totalFans: totalFansCount,
        totalUniqueParticipants: uniqueParticipants.size,
        totalUniqueFans: uniqueFans.size,
        allEvents: eventsInPeriod.map((event) => ({
          id: event.id || event.uuid,
          name: event.title,
          date: event.startDate || new Date().toISOString(),
          participantsCount: event.participantsCount || 0,
          fansCount: event.fansCount || 0,
          totalCount: event.totalCount || 0,
        })).sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        }),
        chartData: chartData.length > 0 ? chartData : [{ month: "—", events: 0, participants: 0, fans: 0 }],
        ordersCount: localOrders.length,
      };

      console.log('Результат статистики:', result);
      return result;
    } catch (err) {
      console.error('Ошибка:', err);
      return {
        totalEvents: 0,
        totalParticipants: 0,
        totalFans: 0,
        totalUniqueParticipants: 0,
        totalUniqueFans: 0,
        allEvents: [],
        chartData: [{ month: "—", events: 0, participants: 0, fans: 0 }],
        ordersCount: 0,
      };
    }
  }, [dateFrom, dateTo, eventsWithParticipants, localOrders]);

  const handleExportPDF = () => {
    const el = reportRef.current;
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[data-pdf-exclude]").forEach((node) => node.remove());
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;left:-9999px;top:0;width:757px;";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    const opt = {
      margin: 5,
      filename: `Отчёт_${dateFrom}_${dateTo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 1, width: 757, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(clone)
      .save()
      .finally(() => {
        if (wrapper.parentNode) document.body.removeChild(wrapper);
      });
  };

  const handleExportExcel = () => {
    const periodLabel = `${dateFrom} — ${dateTo}`;

    const summaryRows = [
      ["Отчёт за период", periodLabel],
      [""],
      ["Число мероприятий", reportData.totalEvents],
      ["Участники (всего регистраций)", reportData.totalParticipants],
      ["Болельщики (всего регистраций)", reportData.totalFans],
      ["Участники (уникальные)", reportData.totalUniqueParticipants],
      ["Болельщики (уникальные)", reportData.totalUniqueFans],
      ["Количество заказов", reportData.ordersCount],
    ];

    const eventsRows = [
      ["№", "Мероприятие", "Дата", "Участников", "Болельщиков", "Всего"],
      ...reportData.allEvents.map((e, i) => [
        i + 1,
        e.name,
        e.date ? new Date(e.date).toLocaleDateString("ru-RU") : "Дата не указана",
        e.participantsCount,
        e.fansCount,
        e.totalCount,
      ]),
    ];

    const chartDataForExport = reportData.chartData.filter((d) => d.month !== "—");
    const monthlyRows = [
      ["Период", "Мероприятия", "Участники", "Болельщики"],
      ...chartDataForExport.map((d) => [d.month, d.events, d.participants, d.fans]),
    ];

    const ordersRows = [
      ["№", "ФИО", "Группа", "Товары", "Статус"],
      ...localOrders.map((o, idx) => [
        idx + 1,
        o.customer || o.customerName || "—",
        o.group || "—",
        Array.isArray(o.products) ? o.products.join("; ") : (o.items || []).join("; "),
        STATUS_LABELS[o.status] || o.status || "—",
      ]),
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsEvents = XLSX.utils.aoa_to_sheet(eventsRows);
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersRows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Сводка");
    XLSX.utils.book_append_sheet(workbook, wsEvents, "Мероприятия");
    XLSX.utils.book_append_sheet(workbook, wsMonthly, "По месяцам");
    XLSX.utils.book_append_sheet(workbook, wsOrders, "Заказы");

    wsSummary["!cols"] = [{ wch: 35 }, { wch: 25 }];
    wsEvents["!cols"] = [{ wch: 6 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    wsMonthly["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    wsOrders["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 40 }, { wch: 18 }];

    XLSX.writeFile(workbook, `Отчёт_${dateFrom}_${dateTo}.xlsx`);
  };

  if (eventsLoading || loadingParticipants) {
    return (
      <section className="statisticsPage">
        <h1 className="statisticsTitle">Статистика</h1>
        <p className="loadingText">Загрузка данных...</p>
      </section>
    );
  }

  return (
    <section className="statisticsPage">
      <h1 className="statisticsTitle">Статистика</h1>

      <div className="statisticsInfoContainer">
        <div ref={reportRef} className="statisticsReportContent">
          <div className="statisticsHeader">
            <h2 className="statisticsMainTitle">Отчёт за указанный период</h2>
            <div className="statisticsPeriod">
              <div className="statisticsDateRange">
                <label className="statisticsDateLabel">
                  С
                  <input
                    type="date"
                    className="statisticsDateInput"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      saveDateRange(e.target.value, dateTo);
                    }}
                  />
                </label>
                <label className="statisticsDateLabel">
                  По
                  <input
                    type="date"
                    className="statisticsDateInput"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      saveDateRange(dateFrom, e.target.value);
                    }}
                  />
                </label>
                <button 
                  onClick={() => {
                    if (eventsWithParticipants.length > 0) {
                      const validDates = eventsWithParticipants
                        .filter(e => e.startDate)
                        .map(e => new Date(e.startDate));
                      if (validDates.length > 0) {
                        const minDate = new Date(Math.min(...validDates));
                        const maxDate = new Date(Math.max(...validDates));
                        setDateFrom(minDate.toISOString().slice(0, 10));
                        setDateTo(maxDate.toISOString().slice(0, 10));
                        saveDateRange(minDate.toISOString().slice(0, 10), maxDate.toISOString().slice(0, 10));
                        return;
                      }
                    }
                    setDateFrom("2020-01-01");
                    setDateTo("2030-12-31");
                    saveDateRange("2020-01-01", "2030-12-31");
                  }}
                  className="showAllBtn"
                >
                  Показать всё
                </button>
              </div>
            </div>
          </div>

          <div className="statisticsGrid">
            <div className="statCard">
              <h3 className="statCardTitle">Мероприятия</h3>
              <p className="statCardValue">{reportData.totalEvents}</p>
              <p className="statCardDescription">Общее количество</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Участники</h3>
              <p className="statCardValue">{reportData.totalParticipants}</p>
              <p className="statCardDescription">Всего регистраций</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Болельщики</h3>
              <p className="statCardValue">{reportData.totalFans}</p>
              <p className="statCardDescription">Всего регистраций</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Уникальные</h3>
              <p className="statCardValue">{reportData.totalUniqueParticipants}</p>
              <p className="statCardDescription">Участников</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Уникальные</h3>
              <p className="statCardValue">{reportData.totalUniqueFans}</p>
              <p className="statCardDescription">Болельщиков</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Заказы</h3>
              <p className="statCardValue">{reportData.ordersCount}</p>
              <p className="statCardDescription">Общее количество</p>
            </div>
          </div>

          <div className="chartContainer" data-pdf-exclude>
            <h3 className="chartTitle chartTitle--centered">Диаграмма по месяцам</h3>
            <div className="chartWrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="events" fill="#3b82f6" name="Мероприятия" />
                  <Bar dataKey="participants" fill="#10b981" name="Участники" />
                  <Bar dataKey="fans" fill="#94a3b8" name="Болельщики" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="statisticsTableContainer">
            <h3 className="chartTitle" style={{ marginBottom: "20px" }}>
              Мероприятия за период
            </h3>
            {reportData.allEvents.length > 0 ? (
              <table className="statisticsTable">
                <thead>
                  <tr>
                    <th>Мероприятие</th>
                    <th>Дата</th>
                    <th>Участников</th>
                    <th>Болельщиков</th>
                    <th>Всего</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.allEvents.map((event) => (
                    <tr key={event.id}>
                      <td style={{ padding: "12px" }}>{event.name}</td>
                      <td style={{ padding: "12px" }}>
                        {event.date ? new Date(event.date).toLocaleDateString("ru-RU") : "Дата не указана"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{event.participantsCount}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{event.fansCount}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{event.totalCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="statisticsEmptyText">Нет мероприятий за выбранный период</p>
            )}
          </div>
        </div>

        <div className="exportButtons">
          <button className="exportButton" onClick={handleExportPDF}>
            Экспорт в PDF
          </button>
          <button className="exportButton" onClick={handleExportExcel}>
            Экспорт в Excel
          </button>
        </div>
      </div>
    </section>
  );
};

export default StatisticsPage;