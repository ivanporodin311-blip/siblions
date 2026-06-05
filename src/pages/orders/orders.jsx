import React, { useState, useEffect } from "react";
import CustomSelect from "../events/modalAddWindow/CustomSelect";
import "./orders.css";

const API_BASE_URL = "https://songeng.voold.online/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Ожидает" },
  { value: "processing", label: "В обработке" },
  { value: "completed", label: "Выполнен" },
  { value: "cancelled", label: "Отменен" },
];

// Массив label'ов для CustomSelect (он работает со строками)
const STATUS_LABELS = STATUS_OPTIONS.map((opt) => opt.label);

// Маппинг: label → value (для отправки на бэкенд)
const labelToValue = (label) => {
  const found = STATUS_OPTIONS.find((opt) => opt.label === label);
  return found ? found.value : label;
};

// Маппинг: value → label (для отображения в CustomSelect)
const valueToLabel = (value) => {
  const found = STATUS_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [editedOrders, setEditedOrders] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingUuid, setSavingUuid] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shop/orders`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Необходима авторизация. Войдите в систему.");
          }
          throw new Error(`Ошибка при загрузке заказов: ${response.status}`);
        }

        const data = await response.json();
        data.sort((a, b) => a.id - b.id);
        const formattedOrders = data.map((order) => ({
          id: order.id,
          uuid: order.uuid,
          customer:
            `${order.user?.lastName || ""} ${order.user?.firstName || ""}`.trim() ||
            order.user?.username ||
            "Неизвестно",
          group: order.user?.username || "—",
          products: [`${order.product?.name || "Товар"} (x${order.quantity || 1})`],
          status: order.status,
        }));

        setOrders(formattedOrders);

        const initialEdited = data.reduce((acc, o) => {
          acc[o.uuid] = o.status;
          return acc;
        }, {});
        setEditedOrders(initialEdited);
      } catch (err) {
        console.error(err);
        setError(err.message || "Не удалось загрузить заказы.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Обработчик изменения статуса через CustomSelect
  // CustomSelect возвращает event.target.value = label (строка),
  // а нам нужно сохранить value (ключ API)
  const handleStatusChange = (uuid, e) => {
    const newLabel = e.target.value;
    const newValue = labelToValue(newLabel);
    setEditedOrders((prev) => ({
      ...prev,
      [uuid]: newValue,
    }));
  };

  // Сохранение статуса одного заказа
  const handleSaveOrder = async (uuid) => {
    setSavingUuid(uuid);
    try {
      const res = await fetch(`${API_BASE_URL}/shop/orders/${uuid}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: editedOrders[uuid] }),
      });

      if (!res.ok) {
        let errorMsg = `Статус ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg = errData.message || errData.error || JSON.stringify(errData);
        } catch {
          try {
            errorMsg = await res.text();
          } catch {}
        }
        throw new Error(errorMsg);
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.uuid === uuid ? { ...o, status: editedOrders[uuid] } : o
        )
      );

      setToastMessage("Статус обновлён");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      alert("Ошибка при сохранении: " + err.message);
    } finally {
      setSavingUuid(null);
    }
  };

  const isOrderChanged = (uuid, currentStatus) => {
    return editedOrders[uuid] !== currentStatus;
  };

  if (isLoading) {
    return (
      <section className="ordersPage">
        <h1 className="ordersPageTitle">Заказы</h1>
        <div className="loadingText">Загрузка данных...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ordersPage">
        <h1 className="ordersPageTitle">Заказы</h1>
        <div className="ordersContentContainer" style={{ color: "red" }}>
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="ordersPage">
      {showToast && (
        <div className="ordersToast">{toastMessage}</div>
      )}
      <h1 className="ordersPageTitle">Заказы</h1>

      <div className="ordersContentContainer">
        <div className="ordersMainContent">
          <table className="ordersTable">
            <thead>
              <tr>
                <th className="orderNumber">№</th>
                <th className="orderCustomer">ФИО</th>
                <th className="orderGroup">ID</th>
                <th className="orderProducts">Товары</th>
                <th className="orderStatus">Статус</th>
                <th className="orderAction"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const changed = isOrderChanged(order.uuid, order.status);
                const isSaving = savingUuid === order.uuid;

                return (
                  <tr key={order.uuid}>
                    <td className="orderNumber">{order.id}</td>
                    <td className="orderCustomer">{order.customer}</td>
                    <td className="orderGroup">{order.group}</td>
                    <td className="orderProducts">
                      {order.products.map((product, index) => (
                        <div key={index} className="productItem">
                          {product}
                        </div>
                      ))}
                    </td>
                    <td className="orderStatus">
                      <div className="ordersCustomSelectWrapper">
                        <CustomSelect
                          name={`status-${order.uuid}`}
                          value={valueToLabel(editedOrders[order.uuid] || order.status)}
                          onChange={(e) => handleStatusChange(order.uuid, e)}
                          options={STATUS_LABELS}
                          placeholder="Выберите статус..."
                        />
                      </div>
                    </td>
                    <td className="orderAction">
                      {changed && (
                        <button
                          className="saveRowButton"
                          onClick={() => handleSaveOrder(order.uuid)}
                          disabled={isSaving}
                        >
                          {isSaving ? "..." : "Сохранить"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default OrdersPage;