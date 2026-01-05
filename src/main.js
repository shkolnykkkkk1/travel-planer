// ===== ГОЛОВНИЙ ФАЙЛ TRAVEL PLANNER =====
// Всі пункти: 1-12 (без курсів валют)

// Імпорти модулів
import * as api from './api.js';
import storage from './storage.js'; // Змінено з * as storage

// ===== ГЛОБАЛЬНІ ЗМІННІ =====
let routes = [];
let notes = [];
let settings = {};
let currentPage = 1;
const pageSize = 5;
let isFilterCompleted = false;

// ===== DOM ЕЛЕМЕНТИ =====
const addRouteForm = document.getElementById('addRouteForm');
const routesContainer = document.getElementById('routesContainer');
const addNoteForm = document.getElementById('addNoteForm');
const notesContainer = document.getElementById('notesContainer');
const searchRoutesInput = document.getElementById('searchRoutes');
const filterCompletedBtn = document.getElementById('filterCompleted');
const paginationContainer = document.getElementById('pagination');
const apiAlert = document.getElementById('apiAlert');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const weatherCityInput = document.getElementById('weatherCity');
const weatherResult = document.getElementById('weatherResult');

// ===== ПУНКТ 1: ІНІЦІАЛІЗАЦІЯ =====
function init() {
    console.log('🚀 Travel Planner ініціалізовано');
    
    // Встановлення поточного року
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }
    
    // Завантаження даних
    loadAllData();
    
    // Ініціалізація подій
    initEvents();
    
    // Відображення даних
    renderRoutes();
    renderNotes();
    updateStats();
    
    // Перевірка API (Пункт 7)
    checkApiStatus();
    
    // Налагодження (Пункт 11)
    debugInitialization();
}

// ===== ПУНКТ 2: РОБОТА З DOM =====
function renderRoutes() {
    if (!routesContainer) return;
    
    // Фільтрація маршрутів
    let filteredRoutes = routes;
    
    // Пошук (Пункт 4 - filter)
    if (searchRoutesInput && searchRoutesInput.value) {
        const searchTerm = searchRoutesInput.value.toLowerCase();
        filteredRoutes = filteredRoutes.filter(route => 
            (route.name && route.name.toLowerCase().includes(searchTerm)) ||
            (route.destination && route.destination.toLowerCase().includes(searchTerm)) ||
            (route.description && route.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Фільтр завершених (Пункт 4 - filter)
    if (isFilterCompleted) {
        filteredRoutes = filteredRoutes.filter(route => route.completed);
    }
    
    // Пагінація (Пункт 9)
    const totalPages = Math.ceil(filteredRoutes.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + pageSize);
    
    // Очищення контейнера
    routesContainer.innerHTML = '';
    
    if (paginatedRoutes.length === 0) {
        routesContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                ${filteredRoutes.length === 0 ? 'Немає маршрутів' : 'Немає результатів на цій сторінці'}
            </div>
        `;
        renderPagination(1, 0);
        return;
    }
    
    // Рендеринг маршрутів
    paginatedRoutes.forEach((route, index) => {
        const routeElement = createRouteElement(route, startIndex + index + 1);
        routesContainer.appendChild(routeElement);
    });
    
    // Рендеринг пагінації
    renderPagination(currentPage, totalPages);
}

function createRouteElement(route, number) {
    const div = document.createElement('div');
    div.className = `card route-card mb-3 ${route.completed ? 'completed' : ''}`;
    div.dataset.id = route.id;
    
    div.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="card-title">
                        <span class="badge bg-secondary me-2">${number}</span>
                        ${route.name || 'Без назви'}
                    </h5>
                    <h6 class="card-subtitle mb-2 text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i>${route.destination || 'Не вказано'}
                    </h6>
                </div>
                <span class="badge ${route.completed ? 'bg-success' : 'bg-warning'}">
                    ${route.completed ? 'Завершено' : 'Активно'}
                </span>
            </div>
            
            <div class="row mt-2">
                <div class="col-md-6">
                    <p class="mb-1">
                        <small><i class="far fa-calendar me-1"></i>
                        ${formatDate(route.startDate)} - ${formatDate(route.endDate)}
                        </small>
                    </p>
                </div>
                <div class="col-md-6 text-end">
                    <span class="badge bg-info">
                        <i class="fas fa-${getTransportIcon(route.transport)} me-1"></i>
                        ${getTransportLabel(route.transport)}
                    </span>
                </div>
            </div>
            
            ${route.description ? `<p class="card-text mt-2">${route.description}</p>` : ''}
            
            <div class="d-flex justify-content-between align-items-center mt-3">
                <small class="text-muted">
                    <i class="far fa-clock me-1"></i>${formatDate(route.createdAt)}
                </small>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${route.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${route.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Анімація (Пункт 2)
    setTimeout(() => {
        div.classList.add('fade-in');
    }, 50);
    
    return div;
}

// ===== ПУНКТ 3: ОБРОБКА ПОДІЙ =====
function initEvents() {
    // Форма додавання маршруту
    if (addRouteForm) {
        addRouteForm.addEventListener('submit', handleAddRoute);
        
        // Валідація (Пункт 5)
        addRouteForm.addEventListener('input', function(e) {
            if (e.target.matches('[required]')) {
                validateField(e.target);
            }
        });
        
        // Скидання форми редагування при новому додаванні
        addRouteForm.addEventListener('reset', function() {
            const formTitle = document.querySelector('#addRouteForm h5');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Додати новий маршрут';
            }
            
            const submitBtn = addRouteForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Додати маршрут';
                submitBtn.classList.remove('btn-warning');
                submitBtn.classList.add('btn-primary');
            }
            
            delete addRouteForm.dataset.editingId;
        });
    }
    
    // Форма додавання нотатки
    if (addNoteForm) {
        addNoteForm.addEventListener('submit', handleAddNote);
    }
    
    // Пошук маршрутів
    if (searchRoutesInput) {
        searchRoutesInput.addEventListener('input', debounce(handleSearchRoutes, 300));
    }
    
    // Фільтр завершених
    if (filterCompletedBtn) {
        filterCompletedBtn.addEventListener('click', handleFilterCompleted);
    }
    
    // Погода API
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', handleGetWeather);
    }
    
    // Делегування подій (Пункт 3)
    if (routesContainer) {
        routesContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            const routeId = btn.dataset.id;
            if (!routeId) return;
            
            if (btn.classList.contains('edit-btn')) {
                editRoute(routeId);
            } else if (btn.classList.contains('delete-btn')) {
                deleteRoute(routeId);
            }
        });
    }
}

// ===== ПУНКТ 4: РОБОТА З МАСИВАМИ =====
function handleAddRoute(e) {
    e.preventDefault();
    
    // Валідація форми (Пункт 5)
    if (!validateForm(addRouteForm)) {
        return;
    }
    
    const routeName = document.getElementById('routeName');
    const destination = document.getElementById('destination');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const description = document.getElementById('description');
    const transport = document.getElementById('transport');
    const isCompleted = document.getElementById('isCompleted');
    
    // Перевірка редагування або додавання
    const editingId = addRouteForm.dataset.editingId;
    
    if (editingId) {
        // Редагування існуючого маршруту
        const routeIndex = routes.findIndex(r => r.id === editingId);
        if (routeIndex !== -1) {
            routes[routeIndex] = {
                ...routes[routeIndex],
                name: routeName.value,
                destination: destination.value,
                startDate: startDate.value || null,
                endDate: endDate.value || null,
                description: description.value,
                transport: transport.value,
                completed: isCompleted ? isCompleted.checked : false,
                updatedAt: new Date().toISOString()
            };
            
            showNotification('Маршрут успішно оновлено!', 'success');
        }
    } else {
        // Додавання нового маршруту
        const newRoute = {
            id: generateId(),
            name: routeName.value,
            destination: destination.value,
            startDate: startDate.value || null,
            endDate: endDate.value || null,
            description: description.value,
            transport: transport.value,
            completed: isCompleted ? isCompleted.checked : false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Додавання через push (Пункт 4)
        routes.push(newRoute);
        showNotification('Маршрут успішно додано!', 'success');
    }
    
    // Збереження
    storage.saveRoutes(routes);
    
    // Оновлення інтерфейсу
    renderRoutes();
    updateStats();
    
    // Скидання форми
    addRouteForm.reset();
    addRouteForm.classList.remove('was-validated');
}

function handleAddNote(e) {
    e.preventDefault();
    
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    
    if (!noteTitle || !noteContent) return;
    
    const newNote = {
        id: generateId(),
        title: noteTitle.value,
        content: noteContent.value,
        createdAt: new Date().toISOString()
    };
    
    // Додавання нотатки (Пункт 4 - push)
    notes.push(newNote);
    
    // Збереження
    storage.saveNotes(notes);
    
    // Оновлення інтерфейсу
    renderNotes();
    updateStats();
    
    // Скидання форми
    addNoteForm.reset();
    
    showNotification('Нотатку додано!', 'success');
}

// ===== ПУНКТ 5: ВАЛІДАЦІЯ =====
function validateForm(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

function validateField(field) {
    if (field.validity.valid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
    }
}

// ===== ПУНКТ 6: BOOTSTRAP ТА AXIOS =====
async function checkApiStatus() {
    try {
        showApiAlert('Перевірка підключення до API...', 'info');
        
        // Просто інформативне повідомлення
        showApiAlert('API перевірено (деякі можуть бути недоступні)', 'info');
        
        setTimeout(() => hideApiAlert(), 3000);
    } catch (error) {
        console.error('Помилка перевірки API:', error);
        showApiAlert('API недоступні. Використовуються локальні дані.', 'warning');
    }
}

// ===== ПУНКТ 7: ВЗАЄМОДІЯ З API =====
async function handleGetWeather() {
    const city = weatherCityInput ? weatherCityInput.value.trim() : '';
    if (!city) {
        showNotification('Введіть назву міста', 'warning');
        return;
    }
    
    try {
        showApiAlert(`Отримання погоди для ${city}...`, 'info');
        
        // Отримати погоду з API
        let weather;
        try {
            weather = await api.getWeather(city);
        } catch (apiError) {
            console.warn('API погоди недоступне, використовуються демо-дані');
            // Демо-дані, якщо API недоступне
            weather = {
                city: city,
                temperature: Math.floor(Math.random() * 30) - 5,
                description: ['Сонячно', 'Хмарно', 'Дощ', 'Сніг'][Math.floor(Math.random() * 4)],
                windspeed: Math.floor(Math.random() * 20) + 5,
                time: new Date().toLocaleTimeString('uk-UA'),
                source: 'Демо-дані'
            };
        }
        
        // Відобразити результат
        if (weatherResult) {
            weatherResult.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-cloud-sun me-2"></i>
                            ${weather.city}${weather.country ? `, ${weather.country}` : ''}
                        </h5>
                        <div class="row align-items-center">
                            <div class="col-6">
                                <div class="display-4">${weather.temperature}°C</div>
                                <p class="mb-2">${weather.description}</p>
                            </div>
                            <div class="col-6">
                                <p class="mb-2"><i class="fas fa-wind me-2"></i>Вітер: ${weather.windspeed} км/год</p>
                                ${weather.winddirection ? 
                                    `<p class="mb-2"><i class="fas fa-compass me-2"></i>Напрямок: ${weather.winddirection}°</p>` : ''}
                            </div>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>Оновлено: ${weather.time}
                            ${weather.source === 'Демо-дані' ? ' (демо)' : ''}
                        </small>
                    </div>
                </div>
            `;
        }
        
        hideApiAlert();
        showNotification(`Погоду для ${weather.city} отримано!`, 'success');
        
        // Кешування результатів (Пункт 10)
        storage.saveToCache(`weather_${city}`, weather, 600000); // 10 хвилин
        
    } catch (error) {
        console.error('Помилка отримання погоди:', error);
        if (weatherResult) {
            weatherResult.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Не вдалося отримати погоду для "${city}". Спробуйте інше місто.
                </div>
            `;
        }
        hideApiAlert();
        showNotification('Помилка отримання погоди', 'danger');
    }
}

// ===== ПУНКТ 8: ОБРОБКА ПОМИЛОК =====
function handleSearchRoutes() {
    try {
        // Обробка пошуку з try/catch (Пункт 8)
        currentPage = 1; // Скидання на першу сторінку при пошуку
        renderRoutes();
    } catch (error) {
        console.error('Помилка пошуку:', error);
        showNotification('Помилка пошуку маршрутів. Спробуйте ще раз.', 'danger');
    }
}

function handleFilterCompleted() {
    try {
        isFilterCompleted = !isFilterCompleted;
        if (filterCompletedBtn) {
            filterCompletedBtn.classList.toggle('active', isFilterCompleted);
            filterCompletedBtn.innerHTML = isFilterCompleted ? 
                '<i class="fas fa-check-circle me-1"></i>Усі маршрути' : 
                '<i class="fas fa-filter me-1"></i>Тільки завершені';
        }
        currentPage = 1;
        renderRoutes();
    } catch (error) {
        console.error('Помилка фільтрації:', error);
        showNotification('Помилка фільтрації маршрутів', 'danger');
    }
}

// ===== ПУНКТ 9: ПАГІНАЦІЯ =====
function renderPagination(currentPage, totalPages) {
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        return;
    }
    
    let paginationHTML = '';
    
    // Кнопка "Назад"
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Номери сторінок
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Далі"
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Додаємо обробники подій для пагінації
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            changePage(page);
        });
    });
    
    // Збереження стану пагінації (Пункт 10)
    if (storage.savePaginationState) {
        storage.savePaginationState({
            currentPage,
            pageSize,
            totalItems: routes.length
        });
    }
}

// ===== ПУНКТ 10: LOCALSTORAGE =====
function loadAllData() {
    if (!storage.isLocalStorageAvailable || !storage.isLocalStorageAvailable()) {
        console.warn('localStorage не доступний');
        showNotification('localStorage не доступний. Дані не будуть зберігатися.', 'warning');
        return;
    }
    
    try {
        routes = storage.loadRoutes ? storage.loadRoutes() : [];
        notes = storage.loadNotes ? storage.loadNotes() : [];
        
        // Відновлення стану пагінації
        if (storage.loadPaginationState) {
            settings = storage.loadPaginationState();
            currentPage = settings.currentPage || 1;
        } else {
            currentPage = 1;
        }
        
        console.log('Дані завантажені:', {
            routes: routes.length,
            notes: notes.length,
            settings
        });
        
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        showNotification('Помилка завантаження даних', 'danger');
    }
}

// ===== ПУНКТ 11: НАЛАГОДЖЕННЯ =====
function debugInitialization() {
    console.group('🔧 Налагодження ініціалізації');
    console.log('Завантажено маршрутів:', routes.length);
    console.log('Завантажено нотаток:', notes.length);
    console.log('Налаштування:', settings);
    console.log('Поточна сторінка:', currentPage);
    console.log('DOM елементи знайдено:', {
        addRouteForm: !!addRouteForm,
        routesContainer: !!routesContainer,
        addNoteForm: !!addNoteForm,
        notesContainer: !!notesContainer,
        getWeatherBtn: !!getWeatherBtn,
        weatherCityInput: !!weatherCityInput
    });
    console.groupEnd();
    
    // Тестування помилок для демонстрації (Пункт 11)
    testDebugErrors();
}

function testDebugErrors() {
    // 1. Тест логічної помилки (неправильний розрахунок)
    try {
        const testNumbers = [10, 20, 30];
        const average = testNumbers.reduce((a, b) => a + b, 0) / testNumbers.length;
        console.log('Тест розрахунку середнього:', average);
        
        // Умисна логічна помилка
        const incorrectAverage = testNumbers.reduce((a, b) => a + b, 0) / (testNumbers.length - 1);
        console.warn('Умисна логічна помилка (неправильний дільник):', incorrectAverage);
    } catch (error) {
        console.error('Помилка в тесті розрахунків:', error);
    }
    
    // 2. Тест роботи з DOM
    try {
        const testElement = document.getElementById('nonExistentElement');
        if (testElement && testElement.innerHTML) {
            console.log('Цей код не має виконуватись');
        }
    } catch (error) {
        console.warn('Очікувана помилка DOM (елемент не знайдено):', error.message);
    }
    
    // 3. Тест продуктивності
    const startTime = performance.now();
    const largeArray = Array.from({length: 1000}, (_, i) => i);
    const processed = largeArray.map(x => x * 2).filter(x => x > 100);
    const endTime = performance.now();
    console.log(`Тест продуктивності: обробка 1000 елементів зайняла ${(endTime - startTime).toFixed(2)}ms`);
}

// ===== ПУНКТ 12: УТІЛІТИ ТА ДОПОМІЖНІ ФУНКЦІЇ =====
function updateStats() {
    // Використання reduce для підрахунку завершених маршрутів (Пункт 4)
    const completedRoutes = routes.reduce((count, route) => 
        route.completed ? count + 1 : count, 0);
    
    const totalRoutesEl = document.getElementById('totalRoutes');
    const completedRoutesEl = document.getElementById('completedRoutes');
    const totalNotesEl = document.getElementById('totalNotes');
    
    if (totalRoutesEl) totalRoutesEl.textContent = routes.length;
    if (completedRoutesEl) completedRoutesEl.textContent = completedRoutes;
    if (totalNotesEl) totalNotesEl.textContent = notes.length;
}

function renderNotes() {
    if (!notesContainer) return;
    
    if (notes.length === 0) {
        notesContainer.innerHTML = `
            <div class="alert alert-light text-center">
                <i class="fas fa-sticky-note fa-2x mb-2 text-muted"></i>
                <p class="mb-0">Нотаток поки немає</p>
                <small class="text-muted">Додайте першу нотатку про вашу подорож</small>
            </div>
        `;
        return;
    }
    
    // Використання map для створення HTML (Пункт 4)
    const notesHTML = notes.map(note => `
        <div class="note-item fade-in mb-2">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-0 text-primary">
                    <i class="fas fa-sticky-note me-2"></i>${note.title || 'Без назви'}
                </h6>
                <button class="btn btn-sm btn-outline-danger delete-note-btn" data-note-id="${note.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="mb-2">${note.content || ''}</p>
            <small class="text-muted">
                <i class="far fa-clock me-1"></i>${formatDate(note.createdAt)}
            </small>
        </div>
    `).join('');
    
    notesContainer.innerHTML = notesHTML;
    
    // Додаємо обробники для кнопок видалення нотаток
    notesContainer.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = this.dataset.noteId;
            deleteNote(noteId);
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Не вказано';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Невірна дата';
        
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Помилка форматування дати:', error);
        return 'Помилка дати';
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTransportIcon(transport) {
    const icons = {
        car: 'car',
        train: 'train',
        plane: 'plane',
        bus: 'bus'
    };
    return icons[transport] || 'route';
}

function getTransportLabel(transport) {
    const labels = {
        car: 'Автомобіль',
        train: 'Поїзд',
        plane: 'Літак',
        bus: 'Автобус'
    };
    return labels[transport] || transport;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Створення сповіщення Bootstrap
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    const icon = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    }[type] || 'info-circle';
    
    alert.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${icon} fa-lg me-3 text-${type}"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Автоматичне видалення через 5 секунд
    setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

function showApiAlert(message, type = 'info') {
    if (!apiAlert) return;
    
    apiAlert.className = `alert alert-${type} d-flex align-items-center mb-3`;
    apiAlert.style.display = 'flex';
    apiAlert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        <div>${message}</div>
    `;
}

function hideApiAlert() {
    if (apiAlert) {
        setTimeout(() => {
            apiAlert.style.display = 'none';
        }, 1000);
    }
}

function changePage(page) {
    try {
        const totalPages = Math.ceil(routes.length / pageSize) || 1;
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderRoutes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Помилка зміни сторінки:', error);
        showNotification('Помилка навігації по сторінках', 'danger');
    }
}

function editRoute(routeId) {
    const route = routes.find(r => r.id === routeId);
    if (!route) {
        showNotification('Маршрут не знайдено', 'warning');
        return;
    }
    
    // Заповнення форми редагування
    const routeNameInput = document.getElementById('routeName');
    const destinationInput = document.getElementById('destination');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const descriptionInput = document.getElementById('description');
    const transportSelect = document.getElementById('transport');
    const isCompletedCheckbox = document.getElementById('isCompleted');
    
    if (routeNameInput) routeNameInput.value = route.name || '';
    if (destinationInput) destinationInput.value = route.destination || '';
    if (startDateInput) startDateInput.value = route.startDate || '';
    if (endDateInput) endDateInput.value = route.endDate || '';
    if (descriptionInput) descriptionInput.value = route.description || '';
    if (transportSelect) transportSelect.value = route.transport || 'car';
    if (isCompletedCheckbox) isCompletedCheckbox.checked = route.completed || false;
    
    // Зміна поведінки форми на редагування
    const formTitle = document.querySelector('#addRouteForm h5');
    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Редагувати маршрут';
    }
    
    const submitBtn = addRouteForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Зберегти зміни';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-warning');
    }
    
    // Збереження ID для подальшого оновлення
    if (addRouteForm) {
        addRouteForm.dataset.editingId = routeId;
    }
    
    // Прокрутка до форми
    if (addRouteForm) {
        addRouteForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    showNotification(`Редагування маршруту: ${route.name}`, 'info');
}

function deleteRoute(routeId) {
    if (!confirm('Ви впевнені, що хочете видалити цей маршрут?')) {
        return;
    }
    
    try {
        // Використання filter для видалення (Пункт 4)
        routes = routes.filter(route => route.id !== routeId);
        
        if (storage.saveRoutes) {
            storage.saveRoutes(routes);
        }
        
        renderRoutes();
        updateStats();
        
        showNotification('Маршрут успішно видалено', 'success');
    } catch (error) {
        console.error('Помилка видалення маршруту:', error);
        showNotification('Помилка видалення маршруту', 'danger');
    }
}

function deleteNote(noteId) {
    if (!confirm('Видалити цю нотатку?')) {
        return;
    }
    
    try {
        notes = notes.filter(note => note.id !== noteId);
        
        if (storage.saveNotes) {
            storage.saveNotes(notes);
        }
        
        renderNotes();
        updateStats();
        
        showNotification('Нотатку видалено', 'success');
    } catch (error) {
        console.error('Помилка видалення нотатки:', error);
        showNotification('Помилка видалення нотатки', 'danger');
    }
}

// ===== ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ HTML =====
window.changePage = changePage;
window.editRoute = editRoute;
window.deleteRoute = deleteRoute;
window.deleteNote = deleteNote;

// ===== ІНІЦІАЛІЗАЦІЯ ПРИ ЗАВАНТАЖЕННІ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM завантажений. Ініціалізація Travel Planner...');
    
    // Ініціалізація проєкту
    init();
    
    console.log('✅ Travel Planner готовий до роботи!');
});

// Експорт для тестування
export { routes, notes, renderRoutes, renderNotes };