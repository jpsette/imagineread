//
//  LocalizationService.swift
//  ImagineRead
//
//  Localization service with reactive updates
//

import SwiftUI

/// Service for managing app localization
final class LocalizationService: ObservableObject {
    
    @Published var language: AppLanguage {
        didSet {
            preferences.saveAppLanguage(language)
        }
    }
    
    private let preferences: PreferencesService
    
    // MARK: - Init
    
    init(preferences: PreferencesService) {
        self.preferences = preferences
        self.language = preferences.appLanguage
    }
    
    // MARK: - Localization Keys
    
    private enum Key: String {
        // General
        case settings, reader, language_, appLanguage, close, ok, about, website, developedBy
        
        // Balloon Text
        case balloonText, balloonLanguage, fontSize, balloonTextNote
        
        // Reader
        case readingMode, lightFilter, navigation, visual
        case bookmarks, noBookmarks, tapToBookmark, page, pages
        case progressBar, display, ofComic
        
        // Library
        case loadingLibrary, noComics, addPDFs
        
        // Settings
        case intensity, preview, size, presetSizes
        case adjustFontSize, adjustFilterIntensity, readerSettingsNote, fontPreviewText
        
        // Add Comic
        case addComic, addComicDescription, enterCode, codePlaceholder
        case or, scanQRCode, codeInfo, codeNotFound
        case pointAtQRCode, cameraPermissionRequired, openSettings
        
        // Offline
        case availableOffline, offlineLibrary, noOfflineComics, offlineNote
        
        // Rating & Completion
        case congratulations, readingComplete, rateComic, leaveComment
        case commentPlaceholder, shareWithFriends, readNext, justFinished
    }
    
    // MARK: - Translation Dictionaries
    
    private let translations: [Key: [AppLanguage: String]] = [
        // General
        .settings: [.portuguese: "Configurações", .english: "Settings", .spanish: "Ajustes", .arabic: "الإعدادات", .french: "Paramètres"],
        .reader: [.portuguese: "Leitor", .english: "Reader", .spanish: "Lector", .arabic: "القارئ", .french: "Lecteur"],
        .language_: [.portuguese: "Idioma", .english: "Language", .spanish: "Idioma", .arabic: "اللغة", .french: "Langue"],
        .appLanguage: [.portuguese: "Idioma do App", .english: "App Language", .spanish: "Idioma de la App", .arabic: "لغة التطبيق", .french: "Langue de l'App"],
        .close: [.portuguese: "Fechar", .english: "Close", .spanish: "Cerrar", .arabic: "إغلاق", .french: "Fermer"],
        .ok: [.portuguese: "OK", .english: "OK", .spanish: "OK", .arabic: "OK", .french: "OK"],
        .about: [.portuguese: "Sobre", .english: "About", .spanish: "Acerca de", .arabic: "حول", .french: "À propos"],
        .website: [.portuguese: "Website", .english: "Website", .spanish: "Website", .arabic: "Website", .french: "Website"],
        .developedBy: [.portuguese: "Desenvolvido por", .english: "Developed by", .spanish: "Desarrollado por", .arabic: "تم التطوير بواسطة", .french: "Développé par"],
        
        // Balloon Text
        .balloonText: [.portuguese: "Texto dos Balões", .english: "Balloon Text", .spanish: "Texto de Globos", .arabic: "نص الفقاعات", .french: "Texte des Bulles"],
        .balloonLanguage: [.portuguese: "Idioma dos Balões", .english: "Balloon Language", .spanish: "Idioma de Globos", .arabic: "لغة الفقاعات", .french: "Langue des Bulles"],
        .fontSize: [.portuguese: "Tamanho da Fonte", .english: "Font Size", .spanish: "Tamaño de Fuente", .arabic: "حجم الخط", .french: "Taille de Police"],
        .balloonTextNote: [.portuguese: "O idioma e tamanho afetam o texto dos balões quando disponível.", .english: "Language and size affect balloon text when available.", .spanish: "El idioma y el tamaño afectan el texto de los globos cuando esta disponible.", .arabic: "تؤثر اللغة والحجم على نص الفقاعات عند توفره.", .french: "La langue et la taille affectent le texte des bulles si disponible."],
        
        // Reader
        .readingMode: [.portuguese: "Modo de Leitura", .english: "Reading Mode", .spanish: "Modo de Lectura", .arabic: "وضع القراءة", .french: "Mode de Lecture"],
        .lightFilter: [.portuguese: "Filtro de Luz", .english: "Light Filter", .spanish: "Filtro de Luz", .arabic: "فلتر الضوء", .french: "Filtre de Lumière"],
        .navigation: [.portuguese: "Navegação", .english: "Navigation", .spanish: "Navegacion", .arabic: "التنقل", .french: "Navigation"],
        .visual: [.portuguese: "Visual", .english: "Visual", .spanish: "Visual", .arabic: "المظهر", .french: "Visuel"],
        .bookmarks: [.portuguese: "Marcadores", .english: "Bookmarks", .spanish: "Marcadores", .arabic: "الإشارات المرجعية", .french: "Signets"],
        .noBookmarks: [.portuguese: "Nenhum marcador", .english: "No bookmarks", .spanish: "Sin marcadores", .arabic: "لا توجد إشارات", .french: "Aucun signet"],
        .tapToBookmark: [.portuguese: "Toque no ícone 🔖 para marcar páginas", .english: "Tap the 🔖 icon to bookmark pages", .spanish: "Toca el icono 🔖 para marcar paginas", .arabic: "اضغط على 🔖 لوضع إشارة مرجعية", .french: "Appuyez sur 🔖 pour marquer les pages"],
        .page: [.portuguese: "Página", .english: "Page", .spanish: "Pagina", .arabic: "صفحة", .french: "Page"],
        .pages: [.portuguese: "páginas", .english: "pages", .spanish: "paginas", .arabic: "صفحات", .french: "pages"],
        .progressBar: [.portuguese: "Barra de Progresso", .english: "Progress Bar", .spanish: "Barra de Progreso", .arabic: "شريط التقدم", .french: "Barre de Progression"],
        .display: [.portuguese: "Exibição", .english: "Display", .spanish: "Pantalla", .arabic: "العرض", .french: "Affichage"],
        .ofComic: [.portuguese: "do quadrinho", .english: "of comic", .spanish: "del comic", .arabic: "من القصة", .french: "de la BD"],
        
        // Library
        .loadingLibrary: [.portuguese: "Carregando biblioteca...", .english: "Loading library...", .spanish: "Cargando biblioteca...", .arabic: "جارٍ تحميل المكتبة...", .french: "Chargement de la bibliothèque..."],
        .noComics: [.portuguese: "Nenhum quadrinho", .english: "No comics", .spanish: "Sin comics", .arabic: "لا توجد قصص مصورة", .french: "Aucune BD"],
        .addPDFs: [.portuguese: "Adicione PDFs na pasta\nComics/ do projeto", .english: "Add PDFs to the\nComics/ folder", .spanish: "Añade PDFs a la carpeta\nComics/", .arabic: "أضف ملفات PDF إلى\nمجلد Comics/", .french: "Ajoutez des PDFs dans\nle dossier Comics/"],
        
        // Settings
        .intensity: [.portuguese: "Intensidade", .english: "Intensity", .spanish: "Intensidad", .arabic: "الشدة", .french: "Intensité"],
        .preview: [.portuguese: "Prévia", .english: "Preview", .spanish: "Vista previa", .arabic: "معاينة", .french: "Aperçu"],
        .size: [.portuguese: "Tamanho", .english: "Size", .spanish: "Tamaño", .arabic: "الحجم", .french: "Taille"],
        .presetSizes: [.portuguese: "Tamanhos Pré-definidos", .english: "Preset Sizes", .spanish: "Tamaños Predefinidos", .arabic: "أحجام مسبقة", .french: "Tailles Prédéfinies"],
        .adjustFontSize: [.portuguese: "Ajuste o tamanho da fonte para melhor legibilidade.", .english: "Adjust font size for better readability.", .spanish: "Ajusta el tamaño de la fuente para una mejor legibilidad.", .arabic: "اضبط حجم الخط لقراءة أفضل.", .french: "Ajustez la taille de la police pour une meilleure lisibilité."],
        .adjustFilterIntensity: [.portuguese: "Ajuste a intensidade do filtro de luz.", .english: "Adjust light filter intensity.", .spanish: "Ajusta la intensidad del filtro de luz.", .arabic: "اضبط شدة فلتر الضوء.", .french: "Ajustez l'intensité du filtre de lumière."],
        .readerSettingsNote: [.portuguese: "Configurações de idioma, fonte, modo de leitura e filtros.", .english: "Language, font, reading mode, and filter settings.", .spanish: "Configuracion de idioma, fuente, modo de lectura y filtros.", .arabic: "إعدادات اللغة والخط ووضع القراءة والفلاتر.", .french: "Paramètres de langue, police, mode de lecture et filtres."],
        .fontPreviewText: [.portuguese: "Olá! Este é um exemplo de como o texto dos balões vai aparecer.", .english: "Hello! This is an example of how the balloon text will appear.", .spanish: "¡Hola! Este es un ejemplo de como aparecera el texto de los globos.", .arabic: "مرحباً! هذا مثال على كيفية ظهور نص الفقاعات.", .french: "Bonjour! Voici un exemple de l'apparence du texte des bulles."],
        
        // Add Comic
        .addComic: [.portuguese: "Adicionar Quadrinho", .english: "Add Comic", .spanish: "Añadir Comic", .arabic: "إضافة قصة مصورة", .french: "Ajouter une BD"],
        .addComicDescription: [.portuguese: "Digite o código de resgate ou escaneie o QR Code para adicionar seu quadrinho.", .english: "Enter the redemption code or scan the QR Code to add your comic.", .spanish: "Ingresa el codigo de canje o escanea el codigo QR para añadir tu comic.", .arabic: "أدخل رمز الاسترداد أو امسح رمز QR لإضافة قصتك المصورة.", .french: "Entrez le code ou scannez le QR Code pour ajouter votre BD."],
        .enterCode: [.portuguese: "Código de Resgate", .english: "Redemption Code", .spanish: "Codigo de Canje", .arabic: "رمز الاسترداد", .french: "Code de Récupération"],
        .codePlaceholder: [.portuguese: "Ex: ABC123XYZ", .english: "Ex: ABC123XYZ", .spanish: "Ej: ABC123XYZ", .arabic: "مثال: ABC123XYZ", .french: "Ex: ABC123XYZ"],
        .or: [.portuguese: "ou", .english: "or", .spanish: "o", .arabic: "أو", .french: "ou"],
        .scanQRCode: [.portuguese: "Escanear QR Code", .english: "Scan QR Code", .spanish: "Escanear Codigo QR", .arabic: "مسح رمز QR", .french: "Scanner le QR Code"],
        .codeInfo: [.portuguese: "Você recebe códigos ao comprar quadrinhos ou assinar planos.", .english: "You receive codes when purchasing comics or subscribing to plans.", .spanish: "Recibes codigos al comprar comics o suscribirte a planes.", .arabic: "تحصل على الرموز عند شراء القصص أو الاشتراك في الخطط.", .french: "Vous recevez des codes lors de l'achat de BD ou d'abonnements."],
        .codeNotFound: [.portuguese: "Código não encontrado. Verifique e tente novamente.", .english: "Code not found. Please check and try again.", .spanish: "Codigo no encontrado. Verifica e intenta de nuevo.", .arabic: "الرمز غير موجود. يرجى التحقق والمحاولة مرة أخرى.", .french: "Code non trouvé. Veuillez vérifier et réessayer."],
        .pointAtQRCode: [.portuguese: "Aponte a câmera para o QR Code", .english: "Point camera at QR Code", .spanish: "Apunta la camara al codigo QR", .arabic: "وجّه الكاميرا نحو رمز QR", .french: "Pointez la caméra vers le QR Code"],
        .cameraPermissionRequired: [.portuguese: "Permissão de câmera necessária", .english: "Camera permission required", .spanish: "Se requiere permiso de camara", .arabic: "إذن الكاميرا مطلوب", .french: "Autorisation de caméra requise"],
        .openSettings: [.portuguese: "Abrir Configurações", .english: "Open Settings", .spanish: "Abrir Ajustes", .arabic: "فتح الإعدادات", .french: "Ouvrir les Réglages"],
        
        // Offline
        .availableOffline: [.portuguese: "Offline", .english: "Offline", .spanish: "Offline", .arabic: "غير متصل", .french: "Hors ligne"],
        .offlineLibrary: [.portuguese: "Disponível Offline", .english: "Available Offline", .spanish: "Disponible Offline", .arabic: "متاح بدون اتصال", .french: "Disponible Hors Ligne"],
        .noOfflineComics: [.portuguese: "Nenhum quadrinho disponível offline", .english: "No comics available offline", .spanish: "Ningún cómic disponible offline", .arabic: "لا توجد قصص متاحة بدون اتصال", .french: "Aucune BD disponible hors ligne"],
        .offlineNote: [.portuguese: "Baixe quadrinhos para ler sem internet", .english: "Download comics to read without internet", .spanish: "Descarga cómics para leer sin internet", .arabic: "حمّل القصص للقراءة بدون إنترنت", .french: "Téléchargez des BD pour lire sans internet"],
        
        // Rating & Completion
        .congratulations: [.portuguese: "Parabéns", .english: "Congratulations", .spanish: "Felicidades", .arabic: "تهانينا", .french: "Félicitations"],
        .readingComplete: [.portuguese: "Leitura Completa", .english: "Reading Complete", .spanish: "Lectura Completa", .arabic: "اكتملت القراءة", .french: "Lecture Terminée"],
        .rateComic: [.portuguese: "Avalie este quadrinho", .english: "Rate this comic", .spanish: "Califica este cómic", .arabic: "قيّم هذه القصة", .french: "Notez cette BD"],
        .leaveComment: [.portuguese: "Deixe um comentário", .english: "Leave a comment", .spanish: "Deja un comentario", .arabic: "اترك تعليقاً", .french: "Laissez un commentaire"],
        .commentPlaceholder: [.portuguese: "O que achou da história?", .english: "What did you think of the story?", .spanish: "¿Qué te pareció la historia?", .arabic: "ما رأيك في القصة؟", .french: "Qu'avez-vous pensé de l'histoire ?"],
        .shareWithFriends: [.portuguese: "Compartilhar com amigos", .english: "Share with friends", .spanish: "Compartir con amigos", .arabic: "شارك مع الأصدقاء", .french: "Partager avec des amis"],
        .readNext: [.portuguese: "Leia a seguir", .english: "Read next", .spanish: "Leer a continuación", .arabic: "اقرأ التالي", .french: "Lire ensuite"],
        .justFinished: [.portuguese: "Acabei de ler", .english: "Just finished", .spanish: "Acabo de terminar", .arabic: "انتهيت للتو من", .french: "Je viens de finir"],
    ]
    
    // MARK: - Helper
    
    private func t(_ key: Key) -> String {
        translations[key]?[language] ?? key.rawValue
    }
    
    // MARK: - Public Accessors
    
    var appName: String { "ImagineRead" }
    var version: String { "v1.0.0" }
    
    // General
    var settings: String { t(.settings) }
    var reader: String { t(.reader) }
    var language_: String { t(.language_) }
    var appLanguage: String { t(.appLanguage) }
    var close: String { t(.close) }
    var ok: String { t(.ok) }
    var about: String { t(.about) }
    var website: String { t(.website) }
    var developedBy: String { t(.developedBy) }
    
    // Balloon Text
    var balloonText: String { t(.balloonText) }
    var balloonLanguage: String { t(.balloonLanguage) }
    var fontSize: String { t(.fontSize) }
    var balloonTextNote: String { t(.balloonTextNote) }
    
    // Reader
    var readingMode: String { t(.readingMode) }
    var lightFilter: String { t(.lightFilter) }
    var navigation: String { t(.navigation) }
    var visual: String { t(.visual) }
    var bookmarks: String { t(.bookmarks) }
    var noBookmarks: String { t(.noBookmarks) }
    var tapToBookmark: String { t(.tapToBookmark) }
    var page: String { t(.page) }
    var pages: String { t(.pages) }
    var progressBar: String { t(.progressBar) }
    var display: String { t(.display) }
    var ofComic: String { t(.ofComic) }
    
    // Library
    var loadingLibrary: String { t(.loadingLibrary) }
    var noComics: String { t(.noComics) }
    var addPDFs: String { t(.addPDFs) }
    
    // Settings
    var intensity: String { t(.intensity) }
    var preview: String { t(.preview) }
    var size: String { t(.size) }
    var presetSizes: String { t(.presetSizes) }
    var adjustFontSize: String { t(.adjustFontSize) }
    var adjustFilterIntensity: String { t(.adjustFilterIntensity) }
    var readerSettingsNote: String { t(.readerSettingsNote) }
    var fontPreviewText: String { t(.fontPreviewText) }
    
    // Add Comic
    var addComic: String { t(.addComic) }
    var addComicDescription: String { t(.addComicDescription) }
    var enterCode: String { t(.enterCode) }
    var codePlaceholder: String { t(.codePlaceholder) }
    var or: String { t(.or) }
    var scanQRCode: String { t(.scanQRCode) }
    var codeInfo: String { t(.codeInfo) }
    var codeNotFound: String { t(.codeNotFound) }
    var pointAtQRCode: String { t(.pointAtQRCode) }
    var cameraPermissionRequired: String { t(.cameraPermissionRequired) }
    var openSettings: String { t(.openSettings) }
    
    // Offline
    var availableOffline: String { t(.availableOffline) }
    var offlineLibrary: String { t(.offlineLibrary) }
    var noOfflineComics: String { t(.noOfflineComics) }
    var offlineNote: String { t(.offlineNote) }
    
    // Rating & Completion
    var congratulations: String { t(.congratulations) }
    var readingComplete: String { t(.readingComplete) }
    var rateComic: String { t(.rateComic) }
    var leaveComment: String { t(.leaveComment) }
    var commentPlaceholder: String { t(.commentPlaceholder) }
    var shareWithFriends: String { t(.shareWithFriends) }
    var readNext: String { t(.readNext) }
    var justFinished: String { t(.justFinished) }
    
    func finishedReading(_ title: String) -> String {
        let templates: [AppLanguage: String] = [
            .portuguese: "Você terminou de ler \"\(title)\"",
            .english: "You finished reading \"\(title)\"",
            .spanish: "Terminaste de leer \"\(title)\"",
            .arabic: "انتهيت من قراءة \"\(title)\"",
            .french: "Vous avez fini de lire \"\(title)\""
        ]
        return templates[language] ?? "Finished \"\(title)\""
    }
    
    // MARK: - Functions
    
    func readingModeName(_ mode: ReadingMode) -> String {
        let names: [ReadingMode: [AppLanguage: String]] = [
            .horizontal: [.portuguese: "Ocidental", .english: "Western", .spanish: "Occidental", .arabic: "غربي", .french: "Occidental"],
            .vertical: [.portuguese: "Vertical", .english: "Vertical", .spanish: "Vertical", .arabic: "عمودي", .french: "Vertical"],
            .oriental: [.portuguese: "Oriental", .english: "Manga", .spanish: "Oriental", .arabic: "مانغا", .french: "Manga"]
        ]
        return names[mode]?[language] ?? mode.rawValue
    }
    
    func readingModeDesc(_ mode: ReadingMode) -> String {
        let descs: [ReadingMode: [AppLanguage: String]] = [
            .horizontal: [.portuguese: "Deslize para esquerda/direita", .english: "Swipe left/right", .spanish: "Desliza izquierda/derecha", .arabic: "اسحب يسار/يمين", .french: "Glissez gauche/droite"],
            .vertical: [.portuguese: "Role para baixo", .english: "Scroll down", .spanish: "Desplaza hacia abajo", .arabic: "مرر للأسفل", .french: "Faites défiler vers le bas"],
            .oriental: [.portuguese: "Estilo mangá (direita para esquerda)", .english: "Manga style (right to left)", .spanish: "Estilo manga (derecha a izquierda)", .arabic: "أسلوب المانغا (من اليمين لليسار)", .french: "Style manga (droite à gauche)"]
        ]
        return descs[mode]?[language] ?? ""
    }
    
    func nightModeName(_ mode: NightMode) -> String {
        let names: [NightMode: [AppLanguage: String]] = [
            .off: [.portuguese: "Desligado", .english: "Off", .spanish: "Apagado", .arabic: "إيقاف", .french: "Désactivé"],
            .sepia: [.portuguese: "Sépia", .english: "Sepia", .spanish: "Sepia", .arabic: "بني داكن", .french: "Sépia"],
            .dark: [.portuguese: "Noturno", .english: "Night", .spanish: "Nocturno", .arabic: "ليلي", .french: "Nuit"]
        ]
        return names[mode]?[language] ?? mode.rawValue
    }
    
    func fontSizeLabel(_ size: Double) -> String {
        let labels: [Double: [AppLanguage: String]] = [
            0.75: [.portuguese: "Pequeno", .english: "Small", .spanish: "Pequeño", .arabic: "صغير", .french: "Petit"],
            1.0: [.portuguese: "Normal", .english: "Normal", .spanish: "Normal", .arabic: "عادي", .french: "Normal"],
            1.25: [.portuguese: "Médio", .english: "Medium", .spanish: "Medio", .arabic: "متوسط", .french: "Moyen"],
            1.5: [.portuguese: "Grande", .english: "Large", .spanish: "Grande", .arabic: "كبير", .french: "Grand"],
            2.0: [.portuguese: "Extra Grande", .english: "Extra Large", .spanish: "Extra Grande", .arabic: "كبير جداً", .french: "Très Grand"]
        ]
        if let label = labels[size]?[language] {
            return label
        }
        let custom: [AppLanguage: String] = [.portuguese: "Personalizado", .english: "Custom", .spanish: "Personalizado", .arabic: "مخصص", .french: "Personnalisé"]
        return custom[language] ?? "Custom"
    }
}
