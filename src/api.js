// ===== API МОДУЛЬ ДЛЯ TRAVEL PLANNER =====
// Пункти 6, 7, 8: API запити, обробка помилок, HTTP запити

// Конфігурація API
const API_CONFIG = {
    REST_COUNTRIES: 'https://restcountries.com/v3.1',
    OPEN_METEO: 'https://api.open-meteo.com/v1/forecast',
    GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
    TIME_API: 'https://worldtimeapi.org/api/timezone'
};

// ===== 1. КРАЇНИ ТА ГЕОГРАФІЯ =====

/**
 * Отримати інформацію про країну
 */
export async function getCountryInfo(countryCode) {
    try {
        console.log(`[API] Отримання інформації про країну: ${countryCode}`);
        
        const response = await axios.get(`${API_CONFIG.REST_COUNTRIES}/alpha/${countryCode}`);
        
        if (response.status !== 200) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }
        
        const country = response.data[0];
        return {
            name: country.name.common,
            officialName: country.name.official,
            capital: country.capital?.[0] || 'Немає даних',
            region: country.region,
            subregion: country.subregion,
            population: country.population.toLocaleString('uk-UA'),
            area: country.area?.toLocaleString('uk-UA') || 'Немає даних',
            languages: Object.values(country.languages || {}).join(', '),
            currency: Object.keys(country.currencies || {})[0] || 'Немає даних',
            flag: country.flags.png,
            timezones: country.timezones
        };
    } catch (error) {
        console.error('[API] Помилка отримання інформації про країну:', error);
        throw new Error('Не вдалося отримати інформацію про країну');
    }
}

/**
 * Пошук країн за назвою (Пункт 4 - filter)
 */
export async function searchCountries(query) {
    try {
        console.log(`[API] Пошук країн: ${query}`);
        
        const response = await axios.get(`${API_CONFIG.REST_COUNTRIES}/name/${query}`);
        
        if (response.status !== 200) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }
        
        // Використання filter та map
        return response.data
            .filter(country => country.name.common.toLowerCase().includes(query.toLowerCase()))
            .map(country => ({
                name: country.name.common,
                code: country.cca2,
                flag: country.flags.png,
                capital: country.capital?.[0] || 'Немає даних',
                population: country.population.toLocaleString('uk-UA'),
                region: country.region
            }));
    } catch (error) {
        console.error('[API] Помилка пошуку країн:', error);
        return [];
    }
}

// ===== 2. РЕАЛЬНА ПОГОДА З OPEN-METEO =====

/**
 * Отримати реальну погоду для міста (Пункт 7)
 */
export async function getWeather(cityName) {
    try {
        console.log(`[API] Отримання реальної погоди для: ${cityName}`);
        
        // 1. Геокодування: отримати координати міста
        const coordinates = await getCityCoordinates(cityName);
        if (!coordinates) {
            throw new Error(`Місто "${cityName}" не знайдено`);
        }
        
        // 2. Отримати погоду за координатами
        const weatherData = await getWeatherByCoordinates(coordinates.lat, coordinates.lon);
        
        // 3. Форматувати результат
        return {
            city: coordinates.name,
            country: coordinates.country || 'Невідомо',
            temperature: Math.round(weatherData.current_weather.temperature),
            windspeed: weatherData.current_weather.windspeed,
            winddirection: weatherData.current_weather.winddirection,
            weathercode: weatherData.current_weather.weathercode,
            time: new Date(weatherData.current_weather.time).toLocaleTimeString('uk-UA'),
            description: getWeatherDescription(weatherData.current_weather.weathercode),
            coordinates: {
                lat: coordinates.lat,
                lon: coordinates.lon
            },
            source: 'Open-Meteo'
        };
        
    } catch (error) {
        console.error('[API] Помилка отримання погоди:', error);
        
        // Запасний варіант - повертаємо демо-дані
        return getDemoWeather(cityName);
    }
}

/**
 * Отримати координати міста (геокодування)
 */
async function getCityCoordinates(cityName) {
    try {
        const response = await axios.get(API_CONFIG.GEOCODING, {
            params: {
                name: cityName,
                count: 1,
                language: 'uk'
            }
        });
        
        if (response.data.results && response.data.results.length > 0) {
            const city = response.data.results[0];
            return {
                name: city.name,
                lat: city.latitude,
                lon: city.longitude,
                country: city.country,
                region: city.admin1
            };
        }
        
        return null;
    } catch (error) {
        console.error('[API] Помилка геокодування:', error);
        return null;
    }
}

/**
 * Отримати погоду за координатами
 */
async function getWeatherByCoordinates(lat, lon) {
    const response = await axios.get(API_CONFIG.OPEN_METEO, {
        params: {
            latitude: lat,
            longitude: lon,
            current_weather: true,
            hourly: 'temperature_2m,relativehumidity_2m',
            timezone: 'auto',
            forecast_days: 1
        }
    });
    
    return response.data;
}

// ===== 3. ЧАС ТА ЧАСОВІ ПОЯСИ =====

/**
 * Отримати поточний час для часового поясу (Пункт 7)
 */
export async function getWorldTime(timezone = 'Europe/Kiev') {
    try {
        console.log(`[API] Отримання часу для: ${timezone}`);
        
        const response = await axios.get(`${API_CONFIG.TIME_API}/${timezone}`);
        
        if (response.status !== 200) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }
        
        const data = response.data;
        return {
            timezone: data.timezone,
            datetime: new Date(data.datetime).toLocaleString('uk-UA'),
            day_of_week: data.day_of_week,
            day_of_year: data.day_of_year,
            week_number: data.week_number,
            abbreviation: data.abbreviation
        };
    } catch (error) {
        console.error('[API] Помилка отримання часу:', error);
        // Повертаємо локальний час як фолбек
        return {
            timezone: timezone,
            datetime: new Date().toLocaleString('uk-UA'),
            day_of_week: new Date().getDay(),
            day_of_year: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000),
            week_number: getWeekNumber(new Date()),
            abbreviation: 'ЛОКАЛЬНИЙ'
        };
    }
}

// ===== 4. ПЕРЕВІРКА API ТА ОБРОБКА ПОМИЛОК =====

/**
 * Перевірка доступності API (Пункт 8)
 */
export async function checkApiHealth() {
    const results = {};
    
    try {
        // Перевіряємо кожне API з обробкою помилок
        // RestCountries - тестуємо через пошук України
        results.restCountries = await testApi(`${API_CONFIG.REST_COUNTRIES}/name/Ukraine`);
        results.openMeteo = await testApi(`${API_CONFIG.OPEN_METEO}?latitude=50.45&longitude=30.52&current_weather=true`);
        results.geocoding = await testApi(`${API_CONFIG.GEOCODING}?name=Київ&count=1`);
        results.timeApi = await testApi(`${API_CONFIG.TIME_API}/Europe/Kiev`);
        
        return {
            available: Object.values(results).filter(Boolean).length,
            total: Object.keys(results).length,
            details: results,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('[API] Помилка перевірки здоров\'я API:', error);
        return { 
            available: Object.values(results).filter(Boolean).length,
            total: 4, 
            details: results,
            error: error.message 
        };
    }
}

async function testApi(url) {
    try {
        const response = await axios.get(url, { 
            timeout: 3000,
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.status === 200;
    } catch (error) {
        console.warn(`[API] Помилка тесту ${url}:`, error.message);
        return false;
    }
}

/**
 * Симуляція затримки для демонстрації (Пункт 8)
 */
export function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Генератор випадкових помилок для тестування (Пункт 8)
 */
export function generateRandomError() {
    const errors = [
        new Error('Мережева помилка: не вдається підключитися до сервера'),
        new Error('Таймаут запиту: сервер не відповідає'),
        new Error('Сервер не відповідає (500 Internal Server Error)'),
        new Error('Невірний формат даних отримано від API'),
        new Error('Квота запитів перевищена: спробуйте пізніше')
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
}

// ===== ДОПОМІЖНІ ФУНКЦІЇ =====

function getWeatherDescription(code) {
    const descriptions = {
        0: '☀️ Ясно',
        1: '🌤️ Переважно ясно',
        2: '⛅ Частково хмарно',
        3: '☁️ Хмарно',
        45: '🌫️ Туман',
        48: '🌫️ Туман з інієм',
        51: '🌧️ Легка мряка',
        53: '🌧️ Помірна мряка',
        55: '🌧️ Густа мряка',
        61: '🌧️ Невеликий дощ',
        63: '🌧️ Помірний дощ',
        65: '🌧️ Сильний дощ',
        71: '❄️ Невеликий сніг',
        73: '❄️ Помірний сніг',
        75: '❄️ Сильний сніг',
        80: '🌧️ Злива',
        81: '🌧️ Сильна злива',
        95: '⛈️ Гроза'
    };
    
    return descriptions[code] || '🌤️ Невідомо';
}

function getDemoWeather(cityName) {
    // Демо-дані на випадок помилки API
    return {
        city: cityName,
        country: 'Демо-країна',
        temperature: Math.floor(Math.random() * 30) - 5, // -5 до +25
        windspeed: (Math.random() * 20).toFixed(1),
        description: ['☀️ Ясно', '🌤️ Хмарно', '🌧️ Дощ', '❄️ Сніг'][Math.floor(Math.random() * 4)],
        time: new Date().toLocaleTimeString('uk-UA'),
        source: 'Демо-дані',
        isDemo: true
    };
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Експорт всіх функцій
export default {
    getCountryInfo,
    getWeather,
    getWorldTime,
    searchCountries,
    checkApiHealth,
    simulateDelay,
    generateRandomError
};