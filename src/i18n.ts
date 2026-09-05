export type Lang = 'es' | 'en' | 'ru';

const translations: Record<Lang, Record<string, string>> = {
    es: {
        // Banner
        'banner.subtitle': 'Alquila un powerbank al instante',
        'banner.download': 'Descargar App',
        'banner.support': 'Atención al cliente',
        // Controls
        'btn.menu': 'Menú',
        'btn.geolocate': 'Mi ubicación',
        'btn.faq': 'FAQ',
        // Side menu
        'menu.faq': '❓ Preguntas frecuentes',
        'menu.city': '🏙️ Cambiar ciudad',
        'menu.contact': '✉️ Contacto',
        'menu.privacy': '🔒 Política de privacidad',
        // City picker
        'city.title': '¿En qué ciudad estás?',
        'city.subtitle': 'Elige una ciudad para ver los puntos Cargamos más cercanos.',
        'city.locate': '📍 Usar mi ubicación',
        // FAQ
        'faq.title': 'Preguntas Frecuentes',
        'faq.q1': '¿Cómo alquilo un powerbank?',
        'faq.a1': 'Paga con tarjeta o con el móvil. Se retendrá un depósito reembolsable. Al devolver el powerbank, se cobrará el alquiler y se liberará el resto.',
        'faq.q2': '¿Cuánto cuesta?',
        'faq.a2': 'Los primeros 2 minutos son gratis. Después, el precio depende del punto y tiene un límite máximo diario. Consulta la tarifa en la estación.',
        'faq.q3': '¿Dónde devuelvo el powerbank?',
        'faq.a3': 'Puedes devolverlo en cualquier punto Cargamos con huecos libres. No tiene que ser el mismo donde lo recogiste.',
        'faq.q4': '¿Qué pasa si no lo devuelvo?',
        'faq.a4': 'Si no lo devuelves, se cobrará el importe establecido como valor del powerbank. El alquiler finalizará y no habrá más cargos.',
        'faq.q5': '¿Es compatible con mi teléfono?',
        'faq.a5': 'Sí. Nuestros powerbanks incluyen cables USB-C y Lightning.',
        'faq.needMoreHelp': '¿No encuentras lo que buscas?',
        'faq.openChat': 'Hablar con el asistente',
        // Station info
        'station.available': 'Disponibles',
        'station.freeSlots': 'Huecos libres',
        'station.total': 'Total',
        'station.freeMinutes': '{0} min gratis, luego {1}/{2} min',
        'station.maxPrice': 'Máx: {0}/día',
        'station.navigate': 'Cómo llegar',
        'station.online': 'Online',
        'station.offline': 'Offline',
        'station.offlineNotice': 'Temporalmente fuera de servicio',
        'station.schedule': 'Horario',
        'station.positions': 'Zonas del local',
        'station.positionsLoading': 'Cargando zonas...',
        'station.cabinets': 'Cabinas',
        'station.about': 'Sobre el local',
        'station.placement': 'Dónde está exactamente',
        'station.photoCounter': '{0} / {1}',
        // Return assistant
        'bot.open': '¿Dónde devuelvo el powerbank?',
        'bot.title': 'Asistente Cargamos',
        'bot.question': '¿Dónde puedo devolver el powerbank?',
        'bot.locating': 'Un momento, estoy buscando tu ubicación...',
        'bot.searching': 'Buscando puntos con huecos libres...',
        'bot.askCity': 'No he podido ubicarte. ¿En qué ciudad estás?',
        'bot.nearYou': 'Estos son los puntos más cercanos con huecos libres:',
        'bot.nearCity': 'Puntos en {0} con huecos libres:',
        'bot.noResults': 'Ahora mismo no veo puntos con huecos libres por aquí. Prueba con otra ciudad o escríbenos.',
        'bot.slots': 'huecos',
        'bot.otherCity': 'Otra ciudad',
        'bot.useLocation': '📍 Usar mi ubicación',
        'bot.humanChat': 'Hablar con una persona',
        'bot.viewFaq': 'Ver preguntas frecuentes',
        'bot.hint': 'Datos en tiempo real del mapa Cargamos.',
        // Geolocation
        'geo.error': 'No se pudo obtener tu ubicación',
        // Cookies
        'cookie.text': 'Usamos cookies para el funcionamiento del mapa.',
        'cookie.accept': 'Aceptar',
        'cookie.privacyLink': 'Política de privacidad',
    },
    en: {
        'banner.subtitle': 'Rent a powerbank instantly',
        'banner.download': 'Download App',
        'banner.support': 'Customer support',
        'btn.menu': 'Menu',
        'btn.geolocate': 'My location',
        'btn.faq': 'FAQ',
        'menu.faq': '❓ FAQ',
        'menu.city': '🏙️ Change city',
        'menu.contact': '✉️ Contact',
        'menu.privacy': '🔒 Privacy policy',
        'city.title': 'Which city are you in?',
        'city.subtitle': 'Pick a city to see the nearest Cargamos points.',
        'city.locate': '📍 Use my location',
        'faq.title': 'Frequently Asked Questions',
        'faq.q1': 'How do I rent a powerbank?',
        'faq.a1': 'Pay by card or with your phone. A refundable deposit is held. When you return the powerbank, the rental is charged and the rest is released.',
        'faq.q2': 'How much does it cost?',
        'faq.a2': 'The first 2 minutes are free. After that, the price depends on the point and has a maximum daily cap. Check the rate at the station.',
        'faq.q3': 'Where do I return the powerbank?',
        'faq.a3': "You can return it at any Cargamos point with free slots. It doesn't have to be the same one where you picked it up.",
        'faq.q4': "What happens if I don't return it?",
        'faq.a4': "If you don't return it, the amount set as the value of the powerbank will be charged. The rental ends there and there are no further charges.",
        'faq.q5': 'Is it compatible with my phone?',
        'faq.a5': 'Yes. Our powerbanks include USB-C and Lightning cables.',
        'faq.needMoreHelp': "Can't find what you're looking for?",
        'faq.openChat': 'Chat with the assistant',
        'station.available': 'Available',
        'station.freeSlots': 'Free slots',
        'station.total': 'Total',
        'station.freeMinutes': '{0} min free, then {1}/{2} min',
        'station.maxPrice': 'Max: {0}/day',
        'station.navigate': 'Get directions',
        'station.online': 'Online',
        'station.offline': 'Offline',
        'station.offlineNotice': 'Temporarily out of service',
        'station.schedule': 'Schedule',
        'station.positions': 'Zones',
        'station.positionsLoading': 'Loading zones...',
        'station.cabinets': 'Cabinets',
        'station.about': 'About the venue',
        'station.placement': 'Exactly where it is',
        'station.photoCounter': '{0} / {1}',
        'bot.open': 'Where do I return the powerbank?',
        'bot.title': 'Cargamos assistant',
        'bot.question': 'Where can I return the powerbank?',
        'bot.locating': 'One moment, looking for your location...',
        'bot.searching': 'Looking for points with free slots...',
        'bot.askCity': "I couldn't locate you. Which city are you in?",
        'bot.nearYou': 'Here are the nearest points with free slots:',
        'bot.nearCity': 'Points in {0} with free slots:',
        'bot.noResults': "I can't see any points with free slots around here right now. Try another city or write to us.",
        'bot.slots': 'slots',
        'bot.otherCity': 'Another city',
        'bot.useLocation': '📍 Use my location',
        'bot.humanChat': 'Talk to a person',
        'bot.viewFaq': 'View FAQ',
        'bot.hint': 'Live data from the Cargamos map.',
        'geo.error': 'Could not get your location',
        'cookie.text': 'We use cookies for the map to work.',
        'cookie.accept': 'Accept',
        'cookie.privacyLink': 'Privacy policy',
    },
    ru: {
        'banner.subtitle': 'Арендуй павербанк мгновенно',
        'banner.download': 'Скачать',
        'banner.support': 'Поддержка клиентов',
        'btn.menu': 'Меню',
        'btn.geolocate': 'Моё местоположение',
        'btn.faq': 'FAQ',
        'menu.faq': '❓ Частые вопросы',
        'menu.city': '🏙️ Сменить город',
        'menu.contact': '✉️ Контакты',
        'menu.privacy': '🔒 Политика конфиденциальности',
        'city.title': 'В каком городе вы находитесь?',
        'city.subtitle': 'Выберите город, чтобы увидеть ближайшие точки Cargamos.',
        'city.locate': '📍 Определить автоматически',
        'faq.title': 'Часто задаваемые вопросы',
        'faq.q1': 'Как арендовать павербанк?',
        'faq.a1': 'Оплатите картой или телефоном. Будет удержан возвращаемый депозит. При возврате павербанка спишется стоимость аренды, а остаток вернётся.',
        'faq.q2': 'Сколько это стоит?',
        'faq.a2': 'Первые 2 минуты бесплатны. Дальше цена зависит от точки и ограничена максимальной суммой в сутки. Тариф указан на станции.',
        'faq.q3': 'Где вернуть павербанк?',
        'faq.a3': 'Вернуть можно в любой точке Cargamos со свободными слотами. Не обязательно в той же, где вы его взяли.',
        'faq.q4': 'Что будет, если не вернуть?',
        'faq.a4': 'Если вы не вернёте павербанк, будет списана сумма, установленная как его стоимость. Аренда на этом завершится, дальнейших списаний не будет.',
        'faq.q5': 'Подходит ли для моего телефона?',
        'faq.a5': 'Да. Наши павербанки оснащены кабелями USB-C и Lightning.',
        'faq.needMoreHelp': 'Не нашли ответ на свой вопрос?',
        'faq.openChat': 'Написать ассистенту',
        'station.available': 'Доступно',
        'station.freeSlots': 'Свободные слоты',
        'station.total': 'Всего',
        'station.freeMinutes': '{0} мин бесплатно, затем {1}/{2} мин',
        'station.maxPrice': 'Макс: {0}/день',
        'station.navigate': 'Как добраться',
        'station.online': 'Онлайн',
        'station.offline': 'Офлайн',
        'station.offlineNotice': 'Временно не работает',
        'station.schedule': 'Расписание',
        'station.positions': 'Зоны заведения',
        'station.positionsLoading': 'Загрузка зон...',
        'station.cabinets': 'Кабинеты',
        'station.about': 'О заведении',
        'station.placement': 'Где именно находится',
        'station.photoCounter': '{0} / {1}',
        'bot.open': 'Где вернуть павербанк?',
        'bot.title': 'Ассистент Cargamos',
        'bot.question': 'Где я могу вернуть павербанк?',
        'bot.locating': 'Секунду, определяю ваше местоположение...',
        'bot.searching': 'Ищу точки со свободными слотами...',
        'bot.askCity': 'Не удалось определить местоположение. В каком городе вы находитесь?',
        'bot.nearYou': 'Ближайшие точки со свободными слотами:',
        'bot.nearCity': 'Точки в городе {0} со свободными слотами:',
        'bot.noResults': 'Сейчас поблизости нет точек со свободными слотами. Попробуйте другой город или напишите нам.',
        'bot.slots': 'слот.',
        'bot.otherCity': 'Другой город',
        'bot.useLocation': '📍 Определить местоположение',
        'bot.humanChat': 'Связаться с оператором',
        'bot.viewFaq': 'Смотреть частые вопросы',
        'bot.hint': 'Данные в реальном времени с карты Cargamos.',
        'geo.error': 'Не удалось определить местоположение',
        'cookie.text': 'Мы используем cookies для работы карты.',
        'cookie.accept': 'Принять',
        'cookie.privacyLink': 'Политика конфиденциальности',
    },
};

const LANG_KEY = 'cargamos-lang';
const LANG_LABELS: Record<Lang, string> = { es: 'ES', en: 'EN', ru: 'RU' };
const KNOWN_LANGS: Lang[] = ['es', 'en', 'ru'];

/** First visit, no saved preference yet: read the browser's language, default to Spanish. */
function detectLang(): Lang {
    const primary = (navigator.language || '').slice(0, 2).toLowerCase();
    return (KNOWN_LANGS as string[]).includes(primary) ? (primary as Lang) : 'es';
}

const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
let currentLang: Lang = savedLang && KNOWN_LANGS.includes(savedLang) ? savedLang : detectLang();
const listeners: Array<(lang: Lang) => void> = [];

export function t(key: string, ...args: string[]): string {
    let text = translations[currentLang][key] || translations['es'][key] || key;
    args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
    });
    return text;
}

export function getLang(): Lang {
    return currentLang;
}

export function setLang(lang: Lang) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn: (lang: Lang) => void) {
    listeners.push(fn);
}

export { LANG_LABELS };
