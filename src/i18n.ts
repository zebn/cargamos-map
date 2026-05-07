export type Lang = 'es' | 'en' | 'ru';

const translations: Record<Lang, Record<string, string>> = {
    es: {
        // Banner
        'banner.subtitle': 'Alquila un powerbank al instante',
        'banner.download': 'Descargar App',
        // Controls
        'btn.menu': 'Menú',
        'btn.geolocate': 'Mi ubicación',
        'btn.faq': 'FAQ',
        // Side menu
        'menu.how': '🔋 ¿Cómo funciona?',
        'menu.pricing': '💰 Precios',
        'menu.faq': '❓ FAQ',
        'menu.download': '📱 Descargar App',
        'menu.downloadAndroid': '🤖 Google Play',
        'menu.contact': '✉️ Contacto',
        // FAQ
        'faq.title': 'Preguntas Frecuentes',
        'faq.q1': '¿Cómo alquilo un powerbank?',
        'faq.a1': 'Descarga la app Cargamos, escanea el código QR de la estación y retira tu powerbank. ¡Así de fácil!',
        'faq.q2': '¿Cuánto cuesta?',
        'faq.a2': 'Los primeros minutos son gratis. Después se cobra por minuto de uso. El precio máximo diario está limitado. Consulta los detalles en cada estación.',
        'faq.q3': '¿Dónde devuelvo el powerbank?',
        'faq.a3': 'Puedes devolverlo en cualquier estación Cargamos con huecos libres. No tiene que ser la misma donde lo recogiste.',
        'faq.q4': '¿Qué pasa si no lo devuelvo?',
        'faq.a4': 'Si no devuelves el powerbank en el plazo establecido, se cobrará el depósito completo.',
        'faq.q5': '¿Es compatible con mi teléfono?',
        'faq.a5': 'Sí, nuestros powerbanks incluyen cables Lightning, USB-C y Micro USB.',
        // Station info
        'station.available': 'Disponibles',
        'station.freeSlots': 'Huecos libres',
        'station.total': 'Total',
        'station.freeMinutes': '{0} min gratis, luego {1}{2}/{3} min',
        'station.maxPrice': 'Máx: {0}{1}/día',
        'station.navigate': 'Cómo llegar',
        'station.online': 'Online',
        'station.offline': 'Offline',
        'station.schedule': 'Horario',
        'station.positions': 'Zonas del local',
        'station.positionsLoading': 'Cargando zonas...',
        'station.cabinets': 'Cabinas',
        // Geolocation
        'geo.error': 'No se pudo obtener tu ubicación',
    },
    en: {
        'banner.subtitle': 'Rent a powerbank instantly',
        'banner.download': 'Download App',
        'btn.menu': 'Menu',
        'btn.geolocate': 'My location',
        'btn.faq': 'FAQ',
        'menu.how': '🔋 How does it work?',
        'menu.pricing': '💰 Pricing',
        'menu.faq': '❓ FAQ',
        'menu.download': '📱 Download App',
        'menu.downloadAndroid': '🤖 Google Play',
        'menu.contact': '✉️ Contact',
        'faq.title': 'Frequently Asked Questions',
        'faq.q1': 'How do I rent a powerbank?',
        'faq.a1': 'Download the Cargamos app, scan the QR code at the station and pick up your powerbank. That easy!',
        'faq.q2': 'How much does it cost?',
        'faq.a2': 'The first minutes are free. After that, you pay per minute of use. The maximum daily price is capped. Check the details at each station.',
        'faq.q3': 'Where do I return the powerbank?',
        'faq.a3': 'You can return it at any Cargamos station with free slots. It doesn\'t have to be the same one where you picked it up.',
        'faq.q4': 'What happens if I don\'t return it?',
        'faq.a4': 'If you don\'t return the powerbank within the set period, the full deposit will be charged.',
        'faq.q5': 'Is it compatible with my phone?',
        'faq.a5': 'Yes, our powerbanks include Lightning, USB-C and Micro USB cables.',
        'station.available': 'Available',
        'station.freeSlots': 'Free slots',
        'station.total': 'Total',
        'station.freeMinutes': '{0} min free, then {1}{2}/{3} min',
        'station.maxPrice': 'Max: {0}{1}/day',
        'station.navigate': 'Get directions',
        'station.online': 'Online',
        'station.offline': 'Offline',
        'station.schedule': 'Schedule',
        'station.positions': 'Zones',
        'station.positionsLoading': 'Loading zones...',
        'station.cabinets': 'Cabinets',
        'geo.error': 'Could not get your location',
    },
    ru: {
        'banner.subtitle': 'Арендуй павербанк мгновенно',
        'banner.download': 'Скачать',
        'btn.menu': 'Меню',
        'btn.geolocate': 'Моё местоположение',
        'btn.faq': 'FAQ',
        'menu.how': '🔋 Как это работает?',
        'menu.pricing': '💰 Цены',
        'menu.faq': '❓ FAQ',
        'menu.download': '📱 Скачать приложение',
        'menu.downloadAndroid': '🤖 Google Play',
        'menu.contact': '✉️ Контакты',
        'faq.title': 'Часто задаваемые вопросы',
        'faq.q1': 'Как арендовать павербанк?',
        'faq.a1': 'Скачайте приложение Cargamos, отсканируйте QR-код на станции и заберите павербанк. Всё просто!',
        'faq.q2': 'Сколько это стоит?',
        'faq.a2': 'Первые минуты бесплатны. После этого оплата поминутная. Максимальная цена за день ограничена. Подробности — на каждой станции.',
        'faq.q3': 'Где вернуть павербанк?',
        'faq.a3': 'Вернуть можно на любой станции Cargamos со свободными слотами. Не обязательно на той же, где вы его взяли.',
        'faq.q4': 'Что будет, если не вернуть?',
        'faq.a4': 'Если павербанк не возвращён в установленный срок, будет списан полный депозит.',
        'faq.q5': 'Подходит ли для моего телефона?',
        'faq.a5': 'Да, наши павербанки оснащены кабелями Lightning, USB-C и Micro USB.',
        'station.available': 'Доступно',
        'station.freeSlots': 'Свободные слоты',
        'station.total': 'Всего',
        'station.freeMinutes': '{0} мин бесплатно, затем {1}{2}/{3} мин',
        'station.maxPrice': 'Макс: {0}{1}/день',
        'station.navigate': 'Как добраться',
        'station.online': 'Онлайн',
        'station.offline': 'Офлайн',
        'station.schedule': 'Расписание',
        'station.positions': 'Зоны заведения',
        'station.positionsLoading': 'Загрузка зон...',
        'station.cabinets': 'Кабинеты',
        'geo.error': 'Не удалось определить местоположение',
    },
};

const LANG_KEY = 'cargamos-lang';
const LANG_LABELS: Record<Lang, string> = { es: 'ES', en: 'EN', ru: 'RU' };

let currentLang: Lang = (localStorage.getItem(LANG_KEY) as Lang) || 'es';
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
