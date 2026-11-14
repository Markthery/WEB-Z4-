const STORAGE_KEY = "quiet-bay-booking-demo-v1";

const cottages = [
  {id:1,name:"Сосновый",capacity:2,price:4500,description:"Небольшой домик среди высоких сосен. Идеален для спокойного отдыха вдвоём.",x:58,y:24},
  {id:2,name:"У озера",capacity:4,price:7200,description:"Светлый дом с видом на воду и собственной террасой для завтраков.",x:28,y:45},
  {id:3,name:"Лесной",capacity:4,price:6500,description:"Уютный деревянный дом рядом с прогулочной тропой и хвойным лесом.",x:76,y:43},
  {id:4,name:"Семейный",capacity:6,price:9800,description:"Просторный дом для всей семьи: две спальни и большая общая зона.",x:44,y:69},
  {id:5,name:"Панорамный",capacity:2,price:8300,description:"Домик с широкими окнами, чтобы любоваться природой в любую погоду.",x:85,y:72},
  {id:6,name:"Уютный",capacity:3,price:5200,description:"Тёплый компактный дом с верандой — отличный вариант на выходные.",x:15,y:67},
  {id:7,name:"Большой берег",capacity:8,price:15000,description:"Самый просторный дом посёлка для большой компании или нескольких семей.",x:66,y:88},
  {id:8,name:"Тихий",capacity:2,price:3900,description:"Уединённый домик в зелёной части посёлка для перезагрузки и тишины.",x:35,y:17}
];
const initiallyOccupied = [3,7];
let bookings = [];
let selectedId = null;
let storageAvailable = true;

const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
const isBooked = (id) => initiallyOccupied.includes(id) || bookings.some(b => b.cottageId === id);

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Некорректный формат данных");
    return parsed.filter(b => b && Number.isInteger(b.cottageId) &&
      cottages.some(c => c.id === b.cottageId) && typeof b.code === "string" &&
      Number.isFinite(b.total) && Number.isInteger(b.nights) && Number.isInteger(b.guests));
  } catch (error) {
    storageAvailable = false;
    $("storage-message").textContent = "Не удалось прочитать сохранённые данные. Можно сбросить демо.";
    return [];
  }
}
function saveBookings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    storageAvailable = true;
    $("storage-message").textContent = "Данные сохраняются локально в браузере.";
    return true;
  } catch (error) {
    storageAvailable = false;
    $("storage-message").textContent = "Браузер не разрешил сохранение. Изменения могут пропасть после обновления.";
    return false;
  }
}

function filteredCottages() {
  const minGuests = Number($("guest-filter").value);
  const maxPrice = Number($("price-filter").value);
  return cottages.filter(c => c.capacity >= minGuests && c.price <= maxPrice);
}
function renderMap(items) {
  const map = $("village-map");
  map.querySelectorAll(".map-house").forEach(el => el.remove());
  items.forEach(c => {
    const occupied = isBooked(c.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-house${selectedId === c.id ? " selected" : ""}${occupied ? " occupied" : ""}`;
    button.style.left = `${c.x}%`;
    button.style.top = `${c.y}%`;
    button.disabled = occupied;
    button.setAttribute("aria-label", `${c.name}, ${occupied ? "занят" : "свободен"}, ${money(c.price)} за ночь`);
    button.setAttribute("aria-pressed", String(selectedId === c.id));
    button.innerHTML = `<span aria-hidden="true">${occupied ? "×" : "⌂"}</span><small>№${c.id}</small>`;
    if (!occupied) button.addEventListener("click", () => selectCottage(c.id));
    map.append(button);
  });
}
function renderList(items) {
  const list = $("cottage-list");
  list.replaceChildren();
  $("results-count").textContent = `${items.length} из ${cottages.length}`;
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "По этим условиям домиков нет. Измените фильтры.";
    list.append(empty);
    return;
  }
  items.forEach(c => {
    const occupied = isBooked(c.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cottage-item${selectedId === c.id ? " active" : ""}`;
    button.disabled = occupied;
    button.setAttribute("aria-pressed", String(selectedId === c.id));
    button.innerHTML = `<span class="house-icon" aria-hidden="true">${occupied ? "×" : "⌂"}</span>
      <span><span class="house-name">${c.name}</span><span class="house-info">до ${c.capacity} гостей · №${c.id}</span>
      <span class="availability${occupied ? " busy" : ""}">${occupied ? "Занят" : "Свободен"}</span></span>
      <span class="house-price">${money(c.price)}<br><span class="muted">за ночь</span></span>`;
    if (!occupied) button.addEventListener("click", () => selectCottage(c.id));
    list.append(button);
  });
}
function renderAll() {
  const items = filteredCottages();
  if (selectedId && !items.some(c => c.id === selectedId)) {
    selectedId = null;
    $("form-message").textContent = "Выбранный домик скрыт фильтрами. Выберите другой.";
  }
  renderMap(items);
  renderList(items);
  renderBookings();
  renderDetails();
}
function selectCottage(id) {
  if (isBooked(id)) return;
  selectedId = id;
  $("form-message").textContent = "";
  renderAll();
  $("guest-count").focus({preventScroll:true});
}
function renderDetails() {
  const c = cottages.find(item => item.id === selectedId);
  const wrap = $("booking-form-wrap");
  if (!c || isBooked(c.id)) {
    $("detail-title").textContent = "Выберите домик";
    $("detail-description").textContent = "Нажмите на свободный домик на карте или выберите его в списке, чтобы увидеть подробности.";
    $("detail-status").textContent = "Не выбран";
    $("detail-status").className = "status-badge";
    wrap.hidden = true;
    return;
  }
  $("detail-title").textContent = c.name;
  $("detail-description").textContent = c.description;
  $("detail-status").textContent = "Свободен";
  $("detail-status").className = "status-badge available";
  $("detail-capacity").textContent = `До ${c.capacity} гостей`;
  $("detail-price").textContent = `${money(c.price)} / ночь`;
  $("guest-count").max = c.capacity;
  $("guest-count").value = Math.min(Number($("guest-count").value) || 2, c.capacity);
  wrap.hidden = false;
  updateTotal();
}
function dateNights() {
  const start = $("checkin-date").value, end = $("checkout-date").value;
  return start && end ? Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) : 0;
}
function syncDates() {
  const nights = dateNights();
  $("night-count").value = nights > 0 ? nights : "";
  updateTotal();
}
function validate() {
  const c = cottages.find(item => item.id === selectedId);
  const guests = Number($("guest-count").value);
  const checkin = $("checkin-date").value;
  const checkout = $("checkout-date").value;
  const nights = dateNights();
  $("guest-error").textContent = "";
  $("night-error").textContent = "";
  $("date-error").textContent = "";
  $("checkout-error").textContent = "";
  let valid = true;
  if (!c || isBooked(selectedId)) {
    $("form-message").textContent = "Сначала выберите свободный домик.";
    return null;
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > c.capacity) {
    $("guest-error").textContent = `Введите число от 1 до ${c.capacity}.`;
    valid = false;
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const arrival = checkin ? new Date(`${checkin}T00:00:00`) : null;
  if (!arrival || arrival < today) {
    $("date-error").textContent = "Выберите дату заезда сегодня или позже.";
    valid = false;
  }
  if (!checkout || nights <= 0) {
    $("checkout-error").textContent = "Выезд должен быть позже заезда.";
    valid = false;
  } else if (nights > 30) {
    $("night-error").textContent = "Можно забронировать не более 30 ночей.";
    valid = false;
  }
  if (!valid) {
    $("form-message").textContent = "Проверьте значения в форме.";
    return null;
  }
  $("form-message").textContent = "";
  return {c, guests, nights, checkin, checkout, total:c.price*nights};
}
function updateTotal() {
  const result = validateForPreview();
  $("total-price").textContent = result ? money(result.total) : "—";
}
function validateForPreview() {
  const c = cottages.find(item => item.id === selectedId);
  if (!c || isBooked(selectedId)) return null;
  const guests = Number($("guest-count").value), nights = dateNights();
  const checkin = $("checkin-date").value;
  const arrival = checkin ? new Date(`${checkin}T00:00:00`) : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!Number.isInteger(guests) || guests < 1 || guests > c.capacity ||
      !arrival || arrival < today || nights < 1 || nights > 30) return null;
  return {total:c.price*nights};
}
function renderBookings() {
  const list = $("bookings-list");
  list.replaceChildren();
  $("booking-count").textContent = bookings.length ? `${bookings.length} ${bookings.length === 1 ? "бронь" : "брони"}` : "Пока нет броней";
  if (!bookings.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Здесь появятся ваши подтверждённые учебные брони.";
    list.append(empty);
    return;
  }
  bookings.forEach(b => {
    const card = document.createElement("article");
    card.className = "booking-card";
    const info = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = `${b.cottageName} · дом №${b.cottageId}`;
    const desc = document.createElement("p");
    desc.textContent = `Бронь ${b.code} · ${b.checkin || ""} — ${b.checkout || ""} · ${b.guests} гостей · ${b.nights} ночей`;
    info.append(heading,desc);
    const sum = document.createElement("div");
    sum.className = "booking-sum";
    const amount = document.createElement("strong");
    amount.textContent = money(b.total);
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "text-button danger-text";
    cancel.textContent = "Отменить бронь";
    cancel.addEventListener("click", () => cancelBooking(b.code));
    sum.append(amount,cancel);
    card.append(info,sum);
    list.append(card);
  });
}
function cancelBooking(code) {
  const booking = bookings.find(b => b.code === code);
  if (!booking) return;
  if (!confirm(`Отменить бронь ${code}? Домик снова станет свободным.`)) return;
  bookings = bookings.filter(b => b.code !== code);
  saveBookings();
  if (selectedId === booking.cottageId) selectedId = null;
  renderAll();
}
$("booking-form").addEventListener("submit", event => {
  event.preventDefault();
  const result = validate();
  if (!result) return;
  if (isBooked(result.c.id)) {
    $("form-message").textContent = "Этот домик уже занят. Выберите другой.";
    renderAll(); return;
  }
  const booking = {
    code: "TB-" + Math.random().toString(36).slice(2,8).toUpperCase(),
    cottageId: result.c.id, cottageName: result.c.name,
    guests: result.guests, checkin: result.checkin, checkout: result.checkout,
    nights: result.nights, total: result.total
  };
  bookings.push(booking);
  saveBookings();
  selectedId = null;
  renderAll();
  $("storage-message").textContent = storageAvailable
    ? `Бронь ${booking.code} подтверждена и сохранена в этом браузере.`
    : "Бронь добавлена на этой странице, но сохранить её не удалось.";
  $("my-bookings").scrollIntoView({behavior:"smooth",block:"start"});
});
["guest-count"].forEach(id => $(id).addEventListener("input", updateTotal));
["checkin-date","checkout-date"].forEach(id => $(id).addEventListener("change", syncDates));
const now = new Date();
const todayISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
$("checkin-date").min = todayISO;
$("checkout-date").min = todayISO;
$("checkin-date").addEventListener("change", () => { $("checkout-date").min = $("checkin-date").value || todayISO; });
$("guest-filter").addEventListener("change", renderAll);
$("price-filter").addEventListener("input", () => {
  $("price-output").textContent = money(Number($("price-filter").value));
  renderAll();
});
$("reset-filters").addEventListener("click", () => {
  $("guest-filter").value = "1"; $("price-filter").value = "15000";
  $("price-output").textContent = money(15000); renderAll();
});
$("reset-demo").addEventListener("click", () => {
  if (!confirm("Удалить все учебные брони и вернуть исходное состояние демо?")) return;
  bookings = []; selectedId = null;
  try { localStorage.removeItem(STORAGE_KEY); storageAvailable = true; }
  catch { storageAvailable = false; }
  $("storage-message").textContent = storageAvailable ? "Демо сброшено. Два домика остаются изначально занятыми." : "Не удалось очистить данные браузера.";
  renderAll();
});

bookings = loadBookings();
$("price-output").textContent = money(15000);
renderAll();
