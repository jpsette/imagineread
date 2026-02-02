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
        
        // Common UI
        case save, cancel, edit, delete_, done
        
        // Annotations
        case annotations, noAnnotations, tapToAnnotate, newAnnotation, editAnnotation
        case yourAnnotation, highlightColor
        
        // Collections
        case collections, newCollection, editCollection, emptyCollection
        case addToCollection, addComics, comic_, myCollections, emptyLibrary
        
        // Profile & Stats
        case myProfile, quickStats, statistics, pagesRead
        case completedComics, readingTime, pagesPerMonth, recentlyRead
        case summary, currentStreak, longestStreak, completedLabel
        case activeDays, readingHistory, days
        case helloReader, memberSince, welcomeMessage, dedicatedReader
        case settingsSubtitle
        
        // Library & Home
        case library_, lastRead, comics_
        
        // Notifications
        case notifications, enableNotifications, allowNotifications, enabled, disabled
        case dailyReminder, inactivityAlert, afterDaysWithoutReading
        
        // Additional Stats UI
        case readingStreak, keepReading, addHint

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
        
        // Common UI
        .save: [.portuguese: "Salvar", .english: "Save", .spanish: "Guardar", .arabic: "حفظ", .french: "Enregistrer"],
        .cancel: [.portuguese: "Cancelar", .english: "Cancel", .spanish: "Cancelar", .arabic: "إلغاء", .french: "Annuler"],
        .edit: [.portuguese: "Editar", .english: "Edit", .spanish: "Editar", .arabic: "تعديل", .french: "Modifier"],
        .delete_: [.portuguese: "Excluir", .english: "Delete", .spanish: "Eliminar", .arabic: "حذف", .french: "Supprimer"],
        
        // Annotations
        .annotations: [.portuguese: "Anotações", .english: "Annotations", .spanish: "Anotaciones", .arabic: "الملاحظات", .french: "Annotations"],
        .noAnnotations: [.portuguese: "Sem Anotações", .english: "No Annotations", .spanish: "Sin Anotaciones", .arabic: "لا توجد ملاحظات", .french: "Aucune Annotation"],
        .tapToAnnotate: [.portuguese: "Toque no ícone de anotação durante\na leitura para adicionar notas.", .english: "Tap the annotation icon while\nreading to add notes.", .spanish: "Toca el ícono de anotación durante\nla lectura para agregar notas.", .arabic: "اضغط على أيقونة الملاحظات\nأثناء القراءة لإضافة ملاحظات.", .french: "Appuyez sur l'icône d'annotation\npendant la lecture pour ajouter des notes."],
        .newAnnotation: [.portuguese: "Nova Anotação", .english: "New Annotation", .spanish: "Nueva Anotación", .arabic: "ملاحظة جديدة", .french: "Nouvelle Annotation"],
        .editAnnotation: [.portuguese: "Editar Anotação", .english: "Edit Annotation", .spanish: "Editar Anotación", .arabic: "تعديل الملاحظة", .french: "Modifier l'Annotation"],
        
        // Collections
        .collections: [.portuguese: "Coleções", .english: "Collections", .spanish: "Colecciones", .arabic: "المجموعات", .french: "Collections"],
        .newCollection: [.portuguese: "Nova Coleção", .english: "New Collection", .spanish: "Nueva Colección", .arabic: "مجموعة جديدة", .french: "Nouvelle Collection"],
        .editCollection: [.portuguese: "Editar Coleção", .english: "Edit Collection", .spanish: "Editar Colección", .arabic: "تعديل المجموعة", .french: "Modifier la Collection"],
        .emptyCollection: [.portuguese: "Coleção Vazia", .english: "Empty Collection", .spanish: "Colección Vacía", .arabic: "مجموعة فارغة", .french: "Collection Vide"],
        .addToCollection: [.portuguese: "Adicionar à Coleção", .english: "Add to Collection", .spanish: "Agregar a Colección", .arabic: "إضافة إلى المجموعة", .french: "Ajouter à la Collection"],
        .addComics: [.portuguese: "Adicionar Quadrinhos", .english: "Add Comics", .spanish: "Agregar Cómics", .arabic: "إضافة قصص", .french: "Ajouter des BDs"],
        .comic_: [.portuguese: "Quadrinho", .english: "Comic", .spanish: "Cómic", .arabic: "قصة مصورة", .french: "BD"],
        
        // Profile & Stats
        .myProfile: [.portuguese: "Meu Perfil", .english: "My Profile", .spanish: "Mi Perfil", .arabic: "ملفي الشخصي", .french: "Mon Profil"],
        .quickStats: [.portuguese: "Estatísticas Rápidas", .english: "Quick Stats", .spanish: "Estadísticas Rápidas", .arabic: "إحصائيات سريعة", .french: "Statistiques Rapides"],
        .statistics: [.portuguese: "Estatísticas", .english: "Statistics", .spanish: "Estadísticas", .arabic: "الإحصائيات", .french: "Statistiques"],
        .pagesRead: [.portuguese: "Páginas Lidas", .english: "Pages Read", .spanish: "Páginas Leídas", .arabic: "الصفحات المقروءة", .french: "Pages Lues"],
        .completedComics: [.portuguese: "Quadrinhos Completos", .english: "Completed Comics", .spanish: "Cómics Completos", .arabic: "قصص مكتملة", .french: "BDs Terminées"],
        .readingTime: [.portuguese: "Tempo de Leitura", .english: "Reading Time", .spanish: "Tiempo de Lectura", .arabic: "وقت القراءة", .french: "Temps de Lecture"],
        .pagesPerMonth: [.portuguese: "Páginas por Mês", .english: "Pages per Month", .spanish: "Páginas por Mes", .arabic: "صفحات شهريًا", .french: "Pages par Mois"],
        .recentlyRead: [.portuguese: "Lidos Recentemente", .english: "Recently Read", .spanish: "Leídos Recientemente", .arabic: "قراءات حديثة", .french: "Lus Récemment"],
        .summary: [.portuguese: "Resumo", .english: "Summary", .spanish: "Resumen", .arabic: "ملخص", .french: "Résumé"],
        .currentStreak: [.portuguese: "Streak Atual", .english: "Current Streak", .spanish: "Racha Actual", .arabic: "السلسلة الحالية", .french: "Série Actuelle"],
        .longestStreak: [.portuguese: "Maior Streak", .english: "Longest Streak", .spanish: "Mejor Racha", .arabic: "أطول سلسلة", .french: "Plus Longue Série"],
        .completedLabel: [.portuguese: "Completos", .english: "Completed", .spanish: "Completados", .arabic: "مكتملة", .french: "Terminés"],
        .activeDays: [.portuguese: "Dias Ativos", .english: "Active Days", .spanish: "Días Activos", .arabic: "الأيام النشطة", .french: "Jours Actifs"],
        .readingHistory: [.portuguese: "Histórico de leitura", .english: "Reading history", .spanish: "Historial de lectura", .arabic: "سجل القراءة", .french: "Historique de lecture"],
        .days: [.portuguese: "dias", .english: "days", .spanish: "días", .arabic: "أيام", .french: "jours"],
        .myCollections: [.portuguese: "Minhas Coleções", .english: "My Collections", .spanish: "Mis Colecciones", .arabic: "مجموعاتي", .french: "Mes Collections"],
        .readingStreak: [.portuguese: "Sequência de Leitura", .english: "Reading Streak", .spanish: "Racha de Lectura", .arabic: "سلسلة القراءة", .french: "Série de Lecture"],
        .keepReading: [.portuguese: "Continue lendo!", .english: "Keep reading!", .spanish: "¡Sigue leyendo!", .arabic: "واصل القراءة!", .french: "Continuez à lire !"],
        .addHint: [.portuguese: "Toque no + para adicionar quadrinhos", .english: "Tap + to add comics", .spanish: "Toca + para agregar cómics", .arabic: "اضغط + لإضافة قصص", .french: "Appuyez sur + pour ajouter"],
        
        // Profile Header
        .helloReader: [.portuguese: "Olá, Leitor!", .english: "Hello, Reader!", .spanish: "¡Hola, Lector!", .arabic: "مرحباً، قارئ!", .french: "Bonjour, Lecteur !"],
        .memberSince: [.portuguese: "Membro desde", .english: "Member since", .spanish: "Miembro desde", .arabic: "عضو منذ", .french: "Membre depuis"],
        .welcomeMessage: [.portuguese: "Bem-vindo ao ImagineRead!", .english: "Welcome to ImagineRead!", .spanish: "¡Bienvenido a ImagineRead!", .arabic: "مرحباً بك في ImagineRead!", .french: "Bienvenue sur ImagineRead !"],
        .dedicatedReader: [.portuguese: "Leitor Dedicado", .english: "Dedicated Reader", .spanish: "Lector Dedicado", .arabic: "قارئ مخلص", .french: "Lecteur Assidu"],
        .settingsSubtitle: [.portuguese: "Idioma, aparência e mais", .english: "Language, appearance and more", .spanish: "Idioma, apariencia y más", .arabic: "اللغة والمظهر والمزيد", .french: "Langue, apparence et plus"],
        
        // Library & Home
        .library_: [.portuguese: "Biblioteca", .english: "Library", .spanish: "Biblioteca", .arabic: "المكتبة", .french: "Bibliothèque"],
        .lastRead: [.portuguese: "Últimos Lidos", .english: "Recently Read", .spanish: "Últimas Lecturas", .arabic: "القراءات الأخيرة", .french: "Dernières Lectures"],
        .comics_: [.portuguese: "quadrinhos", .english: "comics", .spanish: "cómics", .arabic: "قصص", .french: "BDs"],
        .emptyLibrary: [.portuguese: "Biblioteca Vazia", .english: "Empty Library", .spanish: "Biblioteca Vacía", .arabic: "المكتبة فارغة", .french: "Bibliothèque Vide"],
        
        // Annotations Additional
        .yourAnnotation: [.portuguese: "Sua anotação", .english: "Your annotation", .spanish: "Tu anotación", .arabic: "ملاحظتك", .french: "Votre annotation"],
        .highlightColor: [.portuguese: "Cor do destaque", .english: "Highlight color", .spanish: "Color de resaltado", .arabic: "لون التمييز", .french: "Couleur de surlignage"],
        
        // Common UI Additional
        .done: [.portuguese: "Concluído", .english: "Done", .spanish: "Hecho", .arabic: "تم", .french: "Terminé"],
        
        // Notifications
        .notifications: [.portuguese: "Notificações", .english: "Notifications", .spanish: "Notificaciones", .arabic: "الإشعارات", .french: "Notifications"],
        .enableNotifications: [.portuguese: "Ative as Notificações", .english: "Enable Notifications", .spanish: "Habilitar Notificaciones", .arabic: "تفعيل الإشعارات", .french: "Activer les Notifications"],
        .allowNotifications: [.portuguese: "Permitir Notificações", .english: "Allow Notifications", .spanish: "Permitir Notificaciones", .arabic: "السماح بالإشعارات", .french: "Autoriser les Notifications"],
        .enabled: [.portuguese: "Ativo", .english: "Enabled", .spanish: "Activo", .arabic: "مفعّل", .french: "Activé"],
        .disabled: [.portuguese: "Desativado", .english: "Disabled", .spanish: "Desactivado", .arabic: "معطّل", .french: "Désactivé"],
        .dailyReminder: [.portuguese: "Lembrete Diário", .english: "Daily Reminder", .spanish: "Recordatorio Diario", .arabic: "تذكير يومي", .french: "Rappel Quotidien"],
        .inactivityAlert: [.portuguese: "Alerta de Inatividade", .english: "Inactivity Alert", .spanish: "Alerta de Inactividad", .arabic: "تنبيه عدم النشاط", .french: "Alerte d'Inactivité"],
        .afterDaysWithoutReading: [.portuguese: "Após 3 dias sem ler", .english: "After 3 days without reading", .spanish: "Después de 3 días sin leer", .arabic: "بعد 3 أيام بدون قراءة", .french: "Après 3 jours sans lire"],
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
    
    // Common UI
    var save: String { t(.save) }
    var cancel: String { t(.cancel) }
    var edit: String { t(.edit) }
    var delete_: String { t(.delete_) }
    
    // Annotations
    var annotations: String { t(.annotations) }
    var noAnnotations: String { t(.noAnnotations) }
    var tapToAnnotate: String { t(.tapToAnnotate) }
    var newAnnotation: String { t(.newAnnotation) }
    var editAnnotation: String { t(.editAnnotation) }
    
    // Collections
    var collections: String { t(.collections) }
    var newCollection: String { t(.newCollection) }
    var editCollection: String { t(.editCollection) }
    var emptyCollection: String { t(.emptyCollection) }
    var addToCollection: String { t(.addToCollection) }
    var addComics: String { t(.addComics) }
    var comic_: String { t(.comic_) }
    var myCollections: String { t(.myCollections) }
    
    // Profile & Stats
    var myProfile: String { t(.myProfile) }
    var quickStats: String { t(.quickStats) }
    var statistics: String { t(.statistics) }
    var pagesRead: String { t(.pagesRead) }
    var completedComics: String { t(.completedComics) }
    var readingTime: String { t(.readingTime) }
    var pagesPerMonth: String { t(.pagesPerMonth) }
    var recentlyRead: String { t(.recentlyRead) }
    var summary: String { t(.summary) }
    var currentStreak: String { t(.currentStreak) }
    var longestStreak: String { t(.longestStreak) }
    var completedLabel: String { t(.completedLabel) }
    var activeDays: String { t(.activeDays) }
    var readingHistory: String { t(.readingHistory) }
    var days: String { t(.days) }
    var readingStreak: String { t(.readingStreak) }
    var keepReading: String { t(.keepReading) }
    var addHint: String { t(.addHint) }
    var helloReader: String { t(.helloReader) }
    var memberSince: String { t(.memberSince) }
    var welcomeMessage: String { t(.welcomeMessage) }
    var dedicatedReader: String { t(.dedicatedReader) }
    var settingsSubtitle: String { t(.settingsSubtitle) }
    
    // Library & Home
    var library_: String { t(.library_) }
    var lastRead: String { t(.lastRead) }
    var comics_: String { t(.comics_) }
    var emptyLibrary: String { t(.emptyLibrary) }
    
    // Annotations Additional
    var yourAnnotation: String { t(.yourAnnotation) }
    var highlightColor: String { t(.highlightColor) }
    
    // Common UI Additional
    var done: String { t(.done) }
    
    // Notifications
    var notifications: String { t(.notifications) }
    var enableNotifications: String { t(.enableNotifications) }
    var allowNotifications: String { t(.allowNotifications) }
    var enabled: String { t(.enabled) }
    var disabled: String { t(.disabled) }
    var dailyReminder: String { t(.dailyReminder) }
    var inactivityAlert: String { t(.inactivityAlert) }
    var afterDaysWithoutReading: String { t(.afterDaysWithoutReading) }
    
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
