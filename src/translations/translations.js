// Main translation file - contains all texts in the system
export const translations = {
  ar: {
    // Navigation
    home: "الرئيسية",
    trackShipment: "تتبع شحنتك",
    about: "من نحن",
    dashboard: "لوحة التحكم",
    myShipments: "شحناتي",
    menu: "القائمة",
    mainMenu: "القائمة الرئيسية",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    switchLanguage: "تغيير اللغة",
    
    // Menu Items
    createTrip: "إنشاء رحلة",
    branchEntries: "إدخالات الفروع",
    manageDrivers: "إدارة المناديب",
    driverCommissions: "أجور المناديب",
    
    // Sidebar Navigation
    shippingOperations: "عمليات الشحن",
    tripOperations: "عمليات الرحلات",
    vehicleManagement: "إدارة المركبات",
    driversManagement: "إدارة المناديب والعمولات",
    administrativeOperations: "الإدارة والتحكم",
    
    // Driver Commissions Page
    driverCommissionsTitle: "أجور المناديب",
    backToDashboard: "العودة للوحة التحكم",
    exportReport: "تصدير التقرير",
    howCommissionsWork: "كيفية عمل نظام العمولات",
    commissionCalculation: "حساب العمولات",
    commissionCalculationDesc: "يتم حساب العمولة بناءً على إجمالي مبلغ النقل المحصل من الشحنات",
    commissionPercentage: "نسبة العمولة",
    commissionPercentageDesc: "كل مندوب يأخذ نسبة مئوية محددة من إجمالي مبلغ النقل",
    commissionStatus: "حالة العمولة",
    commissionStatusDesc: "تظهر \"معلق\" حتى يتم تغييرها إلى \"تم الدفع\" يدوياً",
    updateStatus: "تحديث الحالة",
    updateStatusDesc: "يمكنك تغيير حالة العمولة باستخدام الأزرار في الجدول",
    totalCommissions: "إجمالي الأجور",
    paidCommissions: "الأجور المدفوعة",
    pendingCommissions: "الأجور المعلقة",
    driver: "المندوب",
    allDrivers: "جميع المناديب",
    status: "الحالة",
    allStatuses: "جميع الحالات",
    paid: "تم الدفع",
    pending: "معلق",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    showOnlyWithAmount: "عرض العمولات ذات المبلغ فقط",
    minimumAmount: "المبلغ الأدنى (USD)",
    driverSummary: "ملخص المندوبين",
    numberOfTrips: "عدد الرحلات",
    totalCommissionsAmount: "إجمالي العمولات",
    paidAmount: "المدفوع",
    pendingAmount: "المعلق",
    commissionsList: "قائمة العمولات",
    showingCommissions: "عرض {count} من {total} عمولة",
    loadingData: "جاري تحميل البيانات...",
    noCommissions: "لا توجد أجور مناديب لعرضها",
    ensureCommissions: "تأكد من:",
    ensureCommissions1: "• وجود رحلات مع مناديب مخصصين",
    ensureCommissions2: "• وجود شحنات محصلة في الرحلات",
    ensureCommissions3: "• تطبيق الفلاتر المحددة",
    tripName: "اسم الرحلة",
    station: "المحطة",
    percentage: "النسبة",
    commissionAmount: "مبلغ الأجرة",
    totalShippingAmount: "إجمالي مبلغ النقل",
    assignedShipments: "الشحنات المسؤول عنها",
    tripDate: "تاريخ الرحلة",
    commissionDetails: "تفاصيل العمولة",
    commissionDetailsDesc: "تفاصيل العمولة:",
    driverLabel: "المندوب:",
    tripLabel: "الرحلة:",
    stationLabel: "المحطة:",
    percentageLabel: "النسبة:",
    commissionAmountLabel: "مبلغ العمولة:",
    totalShippingLabel: "إجمالي مبلغ النقل:",
    assignedShipmentsLabel: "الشحنات المسؤول عنها:",
    statusLabel: "الحالة:",
    dateLabel: "التاريخ:",
    close: "إغلاق",
    clickForDetails: "انقر لعرض تفاصيل العمولة",
    changeToPending: "تغيير إلى معلق",
    changeToPaid: "تغيير إلى تم الدفع",
    cancelPayment: "إلغاء الدفع",
    paymentCompleted: "تم الدفع",
    noAssignedShipments: "لا يوجد",
    commissionUpdated: "تم تحديث حالة العمولة إلى:",
    errorUpdatingCommission: "حدث خطأ أثناء تحديث حالة العمولة.",
    commissionNotFound: "لم يتم العثور على العمولة المحددة.",
    
    // Station Information
    station1: "Station 1",
    stationInfo: "معلومات المحطة",
    stationName: "اسم المحطة",
    enterStationName: "أدخل اسم المحطة",
    stationDescription: "أدخل اسم المحطة أو المدينة التي سيقوم السائق بتوصيل الشحنات إليها",
    stationNameExample: "مثال: نيقوسيا، فاماغوستا، كيرينيا",
    stationNameDesc: "اسم المدينة أو المحطة التي سيتم تسليم الشحنات فيها",
    selectDriver: "اختيار المندوب",
    selectDriverPlaceholder: "اختر المندوب...",
    percentageRequired: "النسبة المئوية",
    percentageRequiredDesc: "نسبة العمولة من أجور الشحن",
    responsibleShipments: "الشحنات المسؤول عنها",
    responsibleShipmentsDesc: "اختر الشحنات التي سيكون المندوب مسؤول عنها",
    notes: "ملاحظات",
    loadingDrivers: "جاري تحميل المناديب...",
    loadingShipments: "جاري تحميل الشحنات...",
    specialNotes: "ملاحظات خاصة...",
    selectedDriverInfo: "معلومات المندوب المختار:",
    name: "الاسم:",
    phone: "الهاتف:",
    area: "المنطقة:",
    numberOfTrips: "عدد الرحلات:",
    shipmentsResponsibleFor: "الشحنات المسؤول عنها:",
    notSpecified: "غير محدد",
    optional: "اختياري",
    notesDesc: "أضف أي ملاحظات خاصة حول هذه المحطة",
    selectDriverDesc: "اختر المندوب المسؤول عن هذه المحطة",
    shipmentCount: "عدد الشحنات",

    
    // Home Page
    companyName: "شركة النقل السريع",
    companyLogo: "شعار الشركة",
    companyLogoLarge: "شعار الشركة الكبير",
    companySlogan: "سرعة بدون تسّرع، وإتقان بدون تقصير. شريكك اللوجستي الموثوق لتوصيل شحناتك بأمان وفي الوقت المحدد.",
    trackNow: "تتبع شحنتك الآن",
    learnMore: "اعرف المزيد عنا",
    
    // Login Page
    welcomeToSystem: "أهلاً بك في نظام النقل",
    loginToAccess: "سجل الدخول للوصول إلى لوحة التحكم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loggingIn: "جارِ الدخول...",
    loginWithGoogle: "تسجيل الدخول باستخدام جوجل",
    or: "أو",
    noAccount: "ليس لديك حساب؟",
    createNewAccount: "أنشئ حساباً جديداً",
    loginFailed: "فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.",
    googleLoginFailed: "فشل تسجيل الدخول باستخدام جوجل.",
    emailNotVerified: "لم يتم تفعيل بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.",
    accountCreatedSuccess: "تم تسجيل حسابك بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.",
    
    // Dashboard
    shipmentsDashboard: "لوحة تحكم الشحنات",
    welcome: "مرحباً،",
    shipmentsStatistics: "إحصائيات الشحنات",
    shipmentsOverview: "نظرة عامة على حالة الشحنات في النظام",
    totalShipments: "إجمالي الشحنات",
    pendingShipments: "الشحنات المعلقة",
    inTransitShipments: "قيد النقل",
    deliveredShipments: "تم التسليم",
    quickActions: "العمليات السريعة",
    chooseOperation: "اختر العملية المطلوبة من القائمة أدناه",
    controlTools: "أدوات التحكم والبحث",
    searchShipments: "ابحث في الشحنات واختر العمليات المطلوبة",
    searchPlaceholder: "ابحث برقم الشحنة، اسم العميل، أو المندوب...",
    all: "الكل",
    pending: "معلق",
    inTransit: "قيد النقل",
    delivered: "تم التسليم",
    resetFilters: "إعادة تعيين الفلاتر",
    
    // Operations Sections
    shippingOperations: "عمليات الشحن",
    newShipment: "شحنة جديدة",
    manageShipments: "إدارة الشحنات",
    tripOperations: "عمليات الرحلات",
    manageTrips: "إدارة الرحلات",
    vehicleManagement: "إدارة المركبات",
    manageVehicles: "إدارة السيارات",
    driversManagement: "إدارة المناديب والعمولات",
    driversWages: "أجور المناديب",
    accountingSystem: "النظام المحاسبي",
    administrativeOperations: "الإدارة والتحكم",
    manageBranches: "إدارة الفروع",
    manageUsers: "إدارة المستخدمين",
    
    // Shipments List
    shipmentsList: "قائمة الشحنات",
    displayManageShipments: "عرض وإدارة جميع الشحنات في النظام",
    loadingShipments: "جاري تحميل الشحنات...",
    shipmentNumber: "رقم الشحنة",
    customer: "العميل",
    governorate: "المدينة",
    goodsValue: "قيمة البضاعة",
    collectibleAmount: "المبلغ المحصل",
    date: "التاريخ",
    status: "الحالة",
    actions: "إجراءات",
    noShipments: "لا توجد شحنات",
    addNewShipment: "قم بإضافة شحنة جديدة لبدء العمل",
    addNewShipmentButton: "إضافة شحنة جديدة",
    
    // Status
    pendingStatus: "معلق",
    inTransitStatus: "قيد النقل",
    deliveredStatus: "تم التسليم",
    
    // Actions
    print: "طباعة",
    copy: "نسخ",
    delete: "حذف",
    edit: "تعديل",
    view: "عرض",
    save: "حفظ",
    cancel: "إلغاء",
    confirm: "تأكيد",
    close: "إغلاق",
    add: "إضافة",
    remove: "إزالة",
    update: "تحديث",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    import: "استيراد",
    
    // Messages
    success: "تم بنجاح",
    error: "خطأ",
    warning: "تحذير",
    info: "معلومات",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات",
    noResults: "لا توجد نتائج",
    copied: "تم النسخ",
    deleted: "تم الحذف",
    saved: "تم الحفظ",
    updated: "تم التحديث",
    
    // 404 Page
    pageNotFound: "الصفحة غير موجودة",
    pageNotFoundDescription: "عذراً، الصفحة التي تبحث عنها غير موجودة.",
    
    // About Page
    aboutTitle: "من نحن",
    aboutDescription: "شركة النقل السريع هي شركة رائدة في مجال النقل والشحن، نقدم خدمات لوجستية متكاملة لعملائنا الكرام.",
    
    // Tracking Page
    trackYourShipment: "تتبع شحنتك",
    enterShipmentNumberBelow: "أدخل رقم الشحنة أدناه لمعرفة حالتها.",
    enterShipmentNumberHere: "أدخل رقم الشحنة هنا...",
    track: "تتبع",
    searching: "جاري البحث...",
    shipmentDetails: "تفاصيل الشحنة",
    hello: "مرحباً",
    latestUpdates: "هذه هي آخر تحديثات شحنتك.",
    lastUpdate: "آخر تحديث",
    pleaseEnterShipmentNumber: "يرجى إدخال رقم الشحنة.",
    shipmentNotFound: "عذراً، لم يتم العثور على شحنة بهذا الرقم.",
    errorFetchingShipmentData: "حدث خطأ أثناء جلب بيانات الشحنة.",
    
    // Shipment Form
    backToShipments: "العودة لإدارة الشحنات",
    editShipment: "تعديل الشحنة",
    basicInformation: "المعلومات الأساسية",
    shipmentNumber: "رقم الشحنة",
    parcelType: "نوع الطرد",
    enterParcelType: "اكتب نوع الطرد",
    customerInformation: "معلومات المستلم",
    customerName: "اسم المستلم",
    customerPhone: "هاتف المستلم",
    phoneNumber: "رقم الهاتف",
    senderInformation: "معلومات المرسل",
    senderName: "اسم المرسل",
    senderPhone: "هاتف المرسل",
    governorate: "المدينة",
    weight: "الوزن",
    parcelCount: "عدد الطرود",
    goodsValue: "قيمة البضاعة",
    goodsCurrency: "عملة البضاعة",
    shippingFee: "أجور الشحن",
    shippingFeeCurrency: "عملة الشحن",
    shippingFeePaymentMethod: "طريقة دفع الشحن",
    transferFee: "أجور التحويل",
    transferFeeCurrency: "عملة التحويل",
    transferFeePaymentMethod: "طريقة دفع التحويل",
    internalTransferFee: "أجور المحول",
    internalTransferFeeCurrency: "عملة المحول",
    notes: "ملاحظات",
    enterNotes: "أدخل الملاحظات",
    collect: "تحصيل",
    prepaid: "مدفوع مسبقاً",
    locationAndPackageDetails: "تفاصيل المدينة والطرد",
    selectGovernorate: "اختر المدينة",
    weightKg: "الوزن (كغ)",
    weightInKg: "الوزن بالكيلوغرام",
    parcelCount: "عدد الطرود",
    financialInformation: "المعلومات المالية",
    usd: "دولار أمريكي",
    try: "ليرة تركية",
    syp: "ليرة سورية",
    additionalNotes: "ملاحظات إضافية",
    anyAdditionalNotes: "أي ملاحظات إضافية...",
    updating: "جاري التحديث",
    adding: "جاري الإضافة",
    updateShipment: "تحديث الشحنة",
    addShipment: "إضافة الشحنة",
    shipmentsManagement: "إدارة الشحنات",
    backToDashboard: "العودة للوحة التحكم",
    addNewShipment: "إضافة شحنة جديدة",
    searchShipments: "البحث في الشحنات...",
    noShipments: "لا توجد شحنات. قم بإضافة شحنة جديدة.",
    deleteShipment: "حذف الشحنة",
    copyTrackingLink: "نسخ رابط التتبع",
    confirmDeleteShipment: "هل أنت متأكد من أنك تريد حذف هذه الشحنة بشكل نهائي؟",
    errorDeletingShipment: "حدث خطأ أثناء حذف الشحنة.",
    errorUpdatingStatus: "حدث خطأ أثناء تحديث الحالة.",
    hideFilters: "إخفاء الفلاتر",
    advancedFilters: "فلاتر متقدمة",
    allShipments: "جميع الشحنات",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    allStatuses: "جميع الحالات",
    allGovernorates: "جميع المدن",
    allMethods: "جميع الطرق",
    allVehicles: "جميع المركبات",
    paymentMethod: "طريقة الدفع",
    assignedVehicle: "المركبة المعينة",
    notSpecified: "غير محدد",
    viewEditShipment: "عرض/تعديل الشحنة",
    noShipmentsMessage: "لا توجد شحنات. قم بإضافة شحنة جديدة.",
    statusReceived: "تم الاستلام من المرسل",
    statusInTransit: "قيد النقل",
    statusArrived: "وصلت الوجهة",
    statusDelivered: "تم التسليم",
    statusReturned: "مرتجع",
    
    // Northern Cyprus Cities
    nicosia: "نيقوسيا",
    famagusta: "فاماغوستا",
    kyrenia: "كيرينيا",
    morphou: "مورفو",
    iskele: "إسكله",
    lefke: "لفكه",
    güzelyurt: "غوزيليورت",
    dipkarpaz: "ديبكارباز",
    bogaz: "بوغاز",
    akdogan: "أكدوغان",
    ercan: "أركان",
    karpaz: "كارباز",
    amount: "المبلغ",
    goToHome: "الرئيسية",
    
    // Manifest Page
    manifestTitle: "تخصيص الشحنات للرحلات",
    companyLogo: "شعار الشركة",
    createNewTrip: "إنشاء رحلة جديدة",
    backToMainDashboard: "→ العودة إلى لوحة التحكم الرئيسية",
    selectShipments: "تحديد الشحنات",
    selectedShipments: "شحنة محددة",
    chooseTrip: "اختر رحلة...",
    assignShipments: "تخصيص الشحنات",
    assigning: "جاري التخصيص...",
    searchShipmentsPlaceholder: "ابحث برقم الشحنة، اسم العميل، أو المحافظة...",
    allShipments: "جميع الشحنات",
    pending: "معلق",
    inTransit: "قيد النقل",
    delivered: "تم التسليم",
    selectAll: "تحديد الكل",
    deselectAll: "إلغاء تحديد الكل",
    loadingData: "جاري تحميل البيانات...",
    select: "تحديد",
    shipmentNumber: "رقم الشحنة",
    customer: "العميل",
    governorate: "المحافظة",
    status: "الحالة",
    assignedTrip: "الرحلة المخصصة",
    collectibleAmount: "المبلغ المحصل",
    notAssigned: "غير مخصص",
    noUnassignedShipments: "لا توجد شحنات غير مخصصة.",
    pleaseSelectShipment: "يرجى تحديد شحنة واحدة على الأقل.",
    pleaseChooseTrip: "يرجى اختيار رحلة.",
    shipmentsAssignedSuccess: "تم تخصيص الشحنات للرحلة بنجاح!",
    trip: "الرحلة",
    addedShipments: "عدد الشحنات المضافة",
    statusUpdatedToInTransit: "تم تحديث حالة الشحنات إلى \"قيد النقل\"",
    errorAssigningShipments: "حدث خطأ أثناء تخصيص الشحنات.",
    notSpecified: "غير محدد",
    
    // Create Trip Page
    createNewTrip: "إنشاء رحلة جديدة",
    backToTripsManagement: "العودة لإدارة الرحلات",
    importantInformation: "معلومات مهمة:",
    totalShippingAmountAuto: "مبلغ النقل الإجمالي سيتم حسابه تلقائياً من الشحنات المعينة للرحلة",
    commissionCalculated: "العمولة ستُحسب بناءً على المبلغ الفعلي المحصل",
    commissionPercentagesEditable: "نسب العمولات يمكن تعديلها لاحقاً في صفحة تفاصيل الرحلة بعد معرفة المبلغ الفعلي",
    tripName: "اسم الرحلة",
    tripNamePlaceholder: "مثال: رحلة شمال قبرص - إسطنبول، رحلة الصباحية",
    selectVehicle: "اختيار السيارة",
    chooseVehicle: "اختر سيارة...",
    destination: "وجهة الرحلة",
    destinationPlaceholder: "مثال: نيقوسيا، فاماغوستا، كيرينيا",
    vehicleOwner: "اسم صاحب السيارة",
    vehicleOwnerPlaceholder: "اسم صاحب السيارة",
    departureDate: "تاريخ المغادرة",
    departureTime: "وقت المغادرة",
    importantNote: "ملاحظة مهمة:",
    totalAmountNote: "مبلغ النقل الإجمالي سيتم حسابه تلقائياً من الشحنات التي ستقوم بتعيينها للرحلة لاحقاً.",
    stationsAndDrivers: "المحطات والمناديب",
    addStation: "إضافة محطة",
    howStationsWork: "كيف تعمل المحطات:",
    stationName: "اسم المحطة: المدينة التي سيتم تسليم الشحنات فيها",
    stationOrder: "ترتيب المحطات: اكتب المحطات بالترتيب من البداية للنهاية",
    stationExample: "مثال: نيقوسيا → فاماغوستا → كيرينيا → مورفو",
    stationDriverInfo: "يجب إدخال معلومات المندوب ونسبة العمولة لكل محطة بشكل منفصل",
    noStations: "لا توجد محطات. قم بإضافة محطة واحدة على الأقل.",
    station: "المحطة",
    deleteStation: "حذف المحطة",
    additionalNotes: "ملاحظات إضافية",
    additionalNotesPlaceholder: "أي ملاحظات إضافية حول الرحلة...",
    tripStatus: "حالة الرحلة",
    waiting: "قيد الانتظار",
    inTransit: "قيد النقل",
    delivered: "تم التسليم",
    cancel: "إلغاء",
    creating: "جاري الإنشاء...",
    createTrip: "إنشاء الرحلة",
    loadingVehicles: "جاري تحميل السيارات...",
    pleaseEnterTripName: "يرجى إدخال اسم الرحلة.",
    pleaseSelectVehicle: "يرجى اختيار سيارة للرحلة.",
    pleaseEnterDestination: "يرجى تحديد وجهة الرحلة.",
    pleaseEnterOwnerName: "يرجى تحديد اسم صاحب السيارة.",
    pleaseAddStation: "يرجى إضافة محطة واحدة على الأقل.",
    pleaseCompleteStationData: "يرجى إكمال جميع البيانات المطلوبة للمحطة",
    tripCreatedSuccess: "تم إنشاء الرحلة بنجاح! يمكنك الآن تخصيص الشحنات لهذه الرحلة.",
    errorCreatingTrip: "حدث خطأ أثناء إنشاء الرحلة.",
    trip: "رحلة",
    new: "جديدة",
    totalShippingAmount: "مبلغ النقل الإجمالي",
    willBeCalculatedAutomatically: "سيتم حسابه تلقائياً من الشحنات المعينة للرحلة",
    commission: "العمولة",
    willBeCalculatedBasedOnActual: "ستُحسب بناءً على المبلغ الفعلي المحصل",
    commissionRates: "نسب العمولات",
    canBeAdjustedLater: "يمكن تعديلها لاحقاً في صفحة تفاصيل الرحلة بعد معرفة المبلغ الفعلي",
    stationName: "اسم المحطة",
    theCityWhereShipments: "المدينة التي سيتم تسليم الشحنات فيها",
    stationOrder: "ترتيب المحطات",
    writeStationsInOrder: "اكتب المحطات بالترتيب من البداية للنهاية",
    example: "مثال",
    aleppoHomsLattakiaDamascus: "نيقوسيا → فاماغوستا → كيرينيا → مورفو",
    youMustEnterDriver: "يجب إدخال معلومات المندوب ونسبة العمولة لكل محطة بشكل منفصل",
    noStationsAdded: "لا توجد محطات. قم بإضافة محطة واحدة على الأقل.",
    returnToTripManagement: "العودة لإدارة الرحلات",
     
    // Trips Management Page
    tripsManagement: "إدارة الرحلات",
    backToDashboard: "العودة للوحة التحكم",
    createNewTrip: "إنشاء رحلة جديدة",
    totalTrips: "إجمالي الرحلات",
    tripsWithShipments: "رحلات مع شحنات",
    waiting: "قيد الانتظار",
    inTransit: "قيد النقل",
    hideFilters: "إخفاء الفلاتر",
    advancedFilters: "فلاتر متقدمة",
    showingTrips: "عرض",
    of: "من",
    trip: "رحلة",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    status: "الحالة",
    allStatuses: "جميع الحالات",
    vehicle: "المركبة",
    allVehicles: "جميع المركبات",
    destination: "الوجهة",
    allDestinations: "جميع الوجهات",
    clearAllFilters: "مسح جميع الفلاتر",
    loadingTrips: "جاري تحميل الرحلات...",
    tripName: "اسم الرحلة",
    vehicleOwner: "صاحب السيارة",
    creationDate: "تاريخ الإنشاء",
    shipmentCount: "عدد الشحنات",
    totalCollections: "إجمالي التحصيلات",
    actions: "إجراءات",
    viewDetails: "عرض التفاصيل",
    confirmDeleteTrip: "هل أنت متأكد من أنك تريد حذف هذه الرحلة؟",
    noteShipmentsReturned: "ملاحظة: سيتم إعادة الشحنات المرتبطة إلى حالة معلق.",
    tripDeletedSuccess: "تم حذف الرحلة بنجاح!",
    shipmentsReturnedToPending: "تم إعادة",
    shipmentsToPending: "شحنة إلى حالة معلق.",
    checkShipmentsPage: "يمكنك التحقق من الشحنات في صفحة إدارة الشحنات.",
    errorDeletingTrip: "حدث خطأ أثناء حذف الرحلة:",
    goToShipmentsPage: "هل تريد الانتقال إلى صفحة إدارة الشحنات للتحقق من حالة الشحنات؟",
    noTrips: "لا توجد رحلات. قم بإنشاء رحلة جديدة.",
    planned: "مخططة",
    inProgress: "قيد التنفيذ",
    completed: "مكتملة",
    cancelled: "ملغية",
    notSpecified: "غير محدد",
    driver: "السائق",
    departureDate: "تاريخ المغادرة",
    numberOfShipments: "عدد الشحنات",
    noTripsFound: "لا توجد رحلات. قم بإنشاء رحلة جديدة.",
    
    // Trip Details Page Excel Export
    tripOverview: "نظرة عامة على الرحلة",
    information: "المعلومات",
    details: "التفاصيل",
    tripDetailsReport: "تقرير تفاصيل الرحلة",
    tripNumber: "رقم الرحلة",
    vehicle: "المركبة",
    vehicleNumber: "رقم المركبة",
    tripStatus: "حالة الرحلة",
    createdBy: "تم الإنشاء بواسطة",
    updateDate: "تاريخ التحديث",
    generalNotes: "ملاحظات عامة",
    none: "لا يوجد",
    financialSummary: "ملخص مالي",
    totalExpenses: "إجمالي المصاريف",
    netProfit: "صافي الربح",
    numberOfDispatchedItems: "عدد العناصر الموزعة",
    numberOfDrivers: "عدد المناديب",
    shipmentDetails: "تفاصيل الشحنات",
    shipmentNumber: "رقم الشحنة",
    senderName: "اسم المرسل",
    receiverName: "اسم المستلم",
    receiverPhone: "رقم هاتف المستلم",
    receiverAddress: "عنوان المستلم",
    goodsCurrency: "عملة البضاعة",
    shippingFee: "أجرة النقل",
    shippingCurrency: "عملة النقل",
    transferFee: "أجرة التحويل",
    transferCurrency: "عملة التحويل",
    shippingPaymentMethod: "طريقة دفع النقل",
    totalCollectible: "إجمالي المحصل",
    collect: "تحصيل",
    prepaid: "مدفوع مسبقاً",
    shipmentsAssociatedWithTrip: "تفاصيل الشحنات المرتبطة بالرحلة",
    noShipmentsAssociatedWithTrip: "لا توجد شحنات مرتبطة بهذه الرحلة",
    stationsAndDrivers: "المحطات والمناديب",
    stationsAndDriversDetails: "تفاصيل المحطات والمناديب",
    station: "المحطة",
    driverName: "اسم المندوب",
    driverPhone: "رقم هاتف المندوب",
    commissionPercentage: "نسبة العمولة",
    commissionAmount: "مبلغ العمولة",
    noStationsSpecifiedForTrip: "لا توجد محطات محددة لهذه الرحلة",
    expenseDetails: "تفاصيل المصاريف",
    tripExpenseDetails: "تفاصيل مصاريف الرحلة",
    expenseType: "نوع المصروف",
    amount: "المبلغ",
    currency: "العملة",
    notes: "ملاحظات",
    vehicleRental: "إيجار المركبة",
    vehicleRentalForTrip: "إيجار المركبة للرحلة",
    fixedExpense: "مصروف ثابت",
    additionalExpense1: "مصروف إضافي 1",
    additionalExpense2: "مصروف إضافي 2",
    additionalExpense: "مصروف إضافي",
    officeExpenses: "مصاريف المكتب",
    administrativeExpenses: "مصاريف إدارية",
    vehicleExpenses: "مصاريف المركبة",
    operationalExpenses: "مصاريف تشغيلية",
    dispatchedItems: "العناصر الموزعة",
    dispatchedItemsFromBranchEntries: "العناصر الموزعة من إدخالات الفرع",
    itemNumber: "رقم العنصر",
    itemName: "اسم العنصر",
    quantity: "الكمية",
    itemValue: "قيمة العنصر",
    originalEntryNumber: "رقم الإدخال الأصلي",
    loadingTripDetails: "جاري تحميل تفاصيل الرحلة...",
    noDataToDisplay: "لا توجد بيانات لعرضها.",
    
    // Branch Entries Page
    branchEntriesManagement: "إدارة البوليصات (وارد/صادر)",
    branchEntriesDescription: "عرض وإدارة البوليصات الواردة والصادرة من/إلى الفروع الأخرى.",
    addNewEntry: "إضافة بوليصة جديدة",
    backToMainDashboard: "→ العودة إلى لوحة التحكم الرئيسية",
    allEntries: "كل الإدخالات",
    pendingDispatch: "بانتظار الإخراج",
    fullyDispatched: "مخرجة بالكامل",
    filteringOptions: "خيارات التصفية",
    entryType: "نوع الإدخال",
    all: "الكل",
    incoming: "وارد",
    outgoing: "صادر",
    branchName: "اسم الفرع",
    searchByBranchName: "ابحث باسم الفرع...",
    entriesList: "قائمة البوليصات",
    loadingEntries: "جاري تحميل البوليصات...",
    noEntriesCreated: "لم يتم إنشاء أي بوليصات بعد أو لا توجد نتائج مطابقة للتصفية.",
    type: "النوع",
    bolNumber: "رقم المشعار",
    numberOfItems: "عدد البنود",
    status: "الحالة",
    creationDate: "تاريخ الإنشاء",
    actions: "إجراءات",
    linkedToVehicle: "مربوطة بمركبة",
    notLinked: "غير مربوطة",
    viewDetails: "عرض التفاصيل",
    linkToVehicle: "ربط بمركبة",
    delete: "حذف",
    failedToLoadEntries: "فشل تحميل البوليصات.",
    confirmDeleteEntry: "هل أنت متأكد من أنك تريد حذف هذه البوليصة بالكامل؟ هذا الإجراء لا يمكن التراجع عنه.",
    entryDeletedSuccess: "تم حذف البوليصة بنجاح.",
    errorDeletingEntry: "حدث خطأ أثناء حذف البوليصة.",
    
    // Vehicles Management Page
    vehiclesManagement: "إدارة السيارات",
    addNewVehicle: "إضافة سيارة جديدة",
    totalVehicles: "إجمالي السيارات",
    activeVehicles: "السيارات النشطة",
    inactiveVehicles: "السيارات المتوقفة",
    active: "نشطة",
    inactive: "متوقفة",
    vehicleNumber: "رقم السيارة",
    vehicleType: "نوع السيارة",
    ownerName: "اسم صاحب السيارة",
    ownerPhone: "هاتف صاحب السيارة",
    capacity: "السعة",
    capacityTons: "السعة (طن)",
    destination: "الوجهة",
    status: "الحالة",
    actions: "إجراءات",
    loadingVehicles: "جاري تحميل السيارات...",
    noVehicles: "لا توجد سيارات. قم بإضافة سيارة جديدة.",
    editVehicle: "تعديل السيارة",
    addVehicle: "إضافة السيارة",
    updateVehicle: "تحديث السيارة",
    vehicleAddedSuccess: "تم إضافة السيارة بنجاح!",
    vehicleUpdatedSuccess: "تم تحديث السيارة بنجاح!",
    confirmDeleteVehicle: "هل أنت متأكد من أنك تريد حذف هذه السيارة؟",
    vehicleDeletedSuccess: "تم حذف السيارة بنجاح!",
    errorSavingVehicle: "حدث خطأ أثناء حفظ السيارة. يرجى المحاولة مرة أخرى.",
    errorDeletingVehicle: "حدث خطأ أثناء حذف السيارة.",
    vehicleNumberPlaceholder: "رقم السيارة",
    vehicleTypePlaceholder: "اكتب نوع السيارة",
    ownerNamePlaceholder: "اسم صاحب السيارة",
    ownerPhonePlaceholder: "رقم الهاتف",
    capacityPlaceholder: "السعة بالطن",
    
    // Drivers Management Page
    driversManagement: "إدارة المناديب",
    addNewDriver: "إضافة مندوب جديد",
    totalDrivers: "إجمالي المناديب",
    activeDrivers: "المناديب النشطين",
    inactiveDrivers: "المناديب غير النشطين",
    driverName: "اسم المندوب",
    driverPhone: "رقم هاتف المندوب",
    location: "المنطقة",
    numberOfTrips: "عدد الرحلات",
    totalEarnings: "إجمالي الأجور",
    lastTrip: "آخر رحلة",
    noLastTrip: "لا يوجد",
    active: "نشط",
    inactive: "غير نشط",
    editDriver: "تعديل المندوب",
    addDriver: "إضافة المندوب",
    updateDriver: "تحديث المندوب",
    driverAddedSuccess: "تم إضافة المندوب بنجاح!",
    driverUpdatedSuccess: "تم تحديث المندوب بنجاح!",
    confirmDeleteDriver: "هل أنت متأكد من أنك تريد حذف هذا المندوب؟",
    driverDeletedSuccess: "تم حذف المندوب بنجاح!",
    errorSavingDriver: "حدث خطأ أثناء حفظ المندوب. يرجى المحاولة مرة أخرى.",
    errorDeletingDriver: "حدث خطأ أثناء حذف المندوب.",
    driverNamePlaceholder: "اسم المندوب",
    driverPhonePlaceholder: "رقم الهاتف",
    locationPlaceholder: "المنطقة أو المحافظة",
    notes: "ملاحظات",
    additionalNotes: "ملاحظات إضافية...",
    loadingDrivers: "جاري تحميل المناديب...",
    noDrivers: "لا يوجد مناديب مسجلين حالياً",
    cancel: "إلغاء",
    update: "تحديث",
    add: "إضافة",
    
    // Branches Management Page
    branchesManagement: "إدارة الفروع",
    addNewBranch: "إضافة فرع جديد",
    totalBranches: "إجمالي الفروع",
    activeBranches: "الفروع النشطة",
    inactiveBranches: "الفروع المتوقفة",
    branchName: "اسم الفرع",
    branchPhone: "هاتف الفرع",
    manager: "المدير",
    managerName: "اسم المدير",
    managerPhone: "هاتف المدير",
    editBranch: "تعديل الفرع",
    addBranch: "إضافة الفرع",
    updateBranch: "تحديث الفرع",
    branchAddedSuccess: "تم إضافة الفرع بنجاح!",
    branchUpdatedSuccess: "تم تحديث الفرع بنجاح!",
    confirmDeleteBranch: "هل أنت متأكد من أنك تريد حذف هذا الفرع؟",
    branchDeletedSuccess: "تم حذف الفرع بنجاح!",
    errorSavingBranch: "حدث خطأ أثناء حفظ الفرع. يرجى المحاولة مرة أخرى.",
    errorDeletingBranch: "حدث خطأ أثناء حذف الفرع.",
    branchNamePlaceholder: "اسم الفرع",
    locationPlaceholder: "الموقع",
    branchPhonePlaceholder: "هاتف الفرع",
    managerNamePlaceholder: "اسم المدير",
    managerPhonePlaceholder: "هاتف المدير",
    loadingBranches: "جاري تحميل الفروع...",
    noBranches: "لا توجد فروع. قم بإضافة فرع جديد.",
    
    // TripDetailsPage
    tripDetails: "تفاصيل الرحلة",
    tripDetailsReport: "تقرير تفاصيل الرحلة",
    tripOverview: "نظرة عامة على الرحلة",
    shipmentDetails: "تفاصيل الشحنات",
    stationsAndDrivers: "المحطات والمناديب",
    expenseDetails: "تفاصيل المصاريف",
    dispatchedItems: "العناصر المخرجة",
    information: "المعلومات",
    details: "التفاصيل",
    tripNumber: "رقم الرحلة",
    tripName: "اسم الرحلة",
    vehicle: "المركبة",
    vehicleNumber: "رقم المركبة",
    destination: "الوجهة",
    tripStatus: "حالة الرحلة",
    creationDate: "تاريخ الإنشاء",
    createdBy: "تم الإنشاء بواسطة",
    updateDate: "تاريخ التحديث",
    generalNotes: "ملاحظات عامة",
    financialSummary: "الملخص المالي",
    totalCollections: "إجمالي التحصيلات",
    totalExpenses: "إجمالي المصاريف",
    netProfit: "صافي الربح",
    numberOfShipments: "عدد الشحنات",
    numberOfDispatchedItems: "عدد العناصر المخرجة",
    numberOfDrivers: "عدد المناديب",
    shipmentsAssociatedWithTrip: "الشحنات المرتبطة بالرحلة",
    shipmentNumber: "رقم الشحنة",
    senderName: "اسم المرسل",
    receiverName: "اسم المستلم",
    receiverPhone: "هاتف المستلم",
    receiverAddress: "عنوان المستلم",
    goodsValue: "قيمة البضاعة",
    goodsCurrency: "عملة البضاعة",
    shippingFee: "أجرة النقل",
    shippingCurrency: "عملة النقل",
    transferFee: "أجرة الحوالة",
    transferCurrency: "عملة الحوالة",
    shippingPaymentMethod: "طريقة دفع النقل",
    totalCollectible: "إجمالي المحصل",
    status: "الحالة",
    notes: "ملاحظات",
    noShipmentsAssociatedWithTrip: "لا توجد شحنات مرتبطة بهذه الرحلة",
    stationsAndDriversDetails: "تفاصيل المحطات والمناديب",
    station: "المحطة",
    driverName: "اسم المندوب",
    driverPhone: "هاتف المندوب",
    commissionPercentage: "نسبة العمولة",
    commissionAmount: "مبلغ العمولة",
    noStationsSpecifiedForTrip: "لا توجد محطات محددة للرحلة",
    tripExpenseDetails: "تفاصيل مصاريف الرحلة",
    expenseType: "نوع المصروف",
    amount: "المبلغ",
    currency: "العملة",
    vehicleRental: "إيجار المركبة",
    vehicleRentalForTrip: "إيجار المركبة للرحلة",
    fixedExpense: "مصروف ثابت",
    additionalExpense1: "مصروف إضافي 1",
    additionalExpense2: "مصروف إضافي 2",
    additionalExpense: "مصروف إضافي",
    officeExpenses: "مصاريف المكتب",
    vehicleExpenses: "مصاريف المركبة",
    administrativeExpenses: "مصاريف إدارية",
    operationalExpenses: "مصاريف تشغيلية",
    dispatchedItemsFromBranchEntries: "العناصر المخرجة من إدخالات الفروع",
    itemNumber: "رقم العنصر",
    itemName: "اسم العنصر",
    quantity: "الكمية",
    itemValue: "قيمة العنصر",
    originalEntryNumber: "رقم الإدخال الأصلي",
    collect: "تحصيل",
    prepaid: "مدفوع مسبقاً",
    none: "لا يوجد",
    loadingTripDetails: "جاري تحميل تفاصيل الرحلة...",
    noDataToDisplay: "لا توجد بيانات للعرض",
    exportExcel: "تصدير Excel",
    printReceipt: "طباعة وصل",
    backToTripsList: "العودة إلى قائمة الرحلات",
    deleteTrip: "حذف الرحلة",
    tripInformation: "معلومات الرحلة",
    changeStatusOfAggregatedTrip: "تغيير حالة هذه الرحلة المجمعة",
    tripStationsAndDelegates: "محطات الرحلة والمناديب",
    editCommissionRates: "تعديل نسب العمولات",
    station: "المحطة",
    responsibleDelegate: "المندوب المسؤول",
    commissionPercentage: "نسبة العمولة",
    commissionAmount: "مبلغ العمولة",
    notes: "ملاحظات",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    totalShippingAmount: "إجمالي مبلغ النقل",
    editCommissionRatesTip: "💡 يمكنك تعديل نسب العمولات بناءً على المبلغ الفعلي المحصل من الشحنات",
    financialSummary: "الملخص المالي",
    totalCollections: "إجمالي التحصيلات",
    totalExpenses: "إجمالي المصاريف",
    netProfitLoss: "صافي الربح/الخسارة",
    expenseManagement: "إدارة المصاريف الإضافية",
    shippingFeesSummary: "ملخص أجور الشحن",
    totalShippingFeesForCollection: "إجمالي أجور الشحن (للتحصيل)",
    vehicleRentalUSD: "إيجار المركبة (USD)",
    additionalExpense1Name: "مصروف إضافي 1 (اسم)",
    additionalExpense1Value: "مصروف إضافي 1 (قيمة)",
    additionalExpense2Name: "مصروف إضافي 2 (اسم)",
    additionalExpense2Value: "مصروف إضافي 2 (قيمة)",
    saveExpenses: "حفظ المصاريف",
    saving: "جاري الحفظ...",
    shipmentsInThisTrip: "الشحنات في هذه الرحلة",
    customer: "العميل",
    phone: "الهاتف",
    governorate: "المحافظة",
    collectibleAmount: "المبلغ المحصل",
    dispatchedItemsFromBranchEntries: "بنود مخرجة من إدخالات الفروع في هذه الرحلة",
    fromEntry: "من إدخال",
    viewOriginalEntry: "عرض الإدخال الأصلي",
    itemDescription: "الوصف",
    dispatchedAmount: "الكمية المخرجة",
    recipientName: "اسم المستلم",
    destinationGovernorate: "محافظة الوجهة",
    printTripReceipt: "طباعة وصل الرحلة",
    print: "طباعة",
    close: "إغلاق",
    
    // Admin Page
    manageUsers: "إدارة المستخدمين",
    usersList: "قائمة المستخدمين",
    addNewUser: "إضافة مستخدم جديد",
    loadingUsers: "جاري تحميل المستخدمين...",
    noUsersToDisplay: "لا يوجد مستخدمون لعرضهم",
    roleUpdatedSuccess: "تم تحديث الصلاحية بنجاح",
    errorUpdatingRole: "حدث خطأ أثناء تحديث الصلاحية",
    confirmDeleteUser: "هل أنت متأكد من أنك تريد حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه",
    userDeletedSuccess: "تم حذف المستخدم بنجاح",
    errorDeletingUser: "حدث خطأ أثناء حذف المستخدم",
    addNewEmployee: "إضافة موظف جديد",
    employeeEmail: "البريد الإلكتروني للموظف",
    permission: "الصلاحية",
    pleaseEnterEmail: "يرجى إدخال البريد الإلكتروني",
    emailAlreadyExists: "هذا البريد الإلكتروني مسجل بالفعل",
    emailAlreadyRegistered: "هذا البريد الإلكتروني مسجل بالفعل",
    userAddedSuccess: "تمت إضافة المستخدم بنجاح",
    errorAddingUser: "حدث خطأ أثناء إضافة المستخدم",
    adding: "جاري الإضافة",
    adminYou: "مدير (أنت)",
    role: "الصلاحية",
    customer: "العميل",
    employee: "الموظف",
    admin: "المدير",
    cancel: "إلغاء",
    add: "إضافة",
    delete: "حذف",
    email: "البريد الإلكتروني",
    actions: "الإجراءات",

    // Accounting System
    accountingSystem: "النظام المحاسبي",
    dailyJournal: "دفتر اليومية",
    financialTransactions: "العمليات المالية",
    addTransaction: "إضافة عملية مالية",
    transactionType: "نوع العملية",
    income: "إيراد",
    expense: "مصروف",
    refund: "مرتجع",
    allTypes: "جميع الأنواع",
    customerName: "اسم العميل",
    customerPhone: "هاتف العميل",
    amount: "المبلغ",
    currency: "العملة",
    description: "الوصف",
    reference: "رقم المرجع",
    currentBalance: "الرصيد الحالي",
    balanceAfter: "الرصيد بعد العملية",
    totalIncome: "إجمالي الإيرادات",
    totalExpenses: "إجمالي المصروفات",
    totalRefunds: "إجمالي المرتجعات",
    netBalance: "صافي الرصيد",
    todayTransactions: "عمليات اليوم",
    thisMonthTransactions: "عمليات هذا الشهر",
    searchTransactions: "البحث في العمليات...",
    noTransactions: "لا توجد عمليات مالية",
    addNewTransaction: "إضافة عملية جديدة",
    transactionAddedSuccess: "تم إضافة العملية بنجاح",
    errorAddingTransaction: "حدث خطأ أثناء إضافة العملية",
    transactionUpdatedSuccess: "تم تحديث العملية بنجاح",
    errorUpdatingTransaction: "حدث خطأ أثناء تحديث العملية",
    transactionDeletedSuccess: "تم حذف العملية بنجاح",
    errorDeletingTransaction: "حدث خطأ أثناء حذف العملية",
    confirmDeleteTransaction: "هل أنت متأكد من أنك تريد حذف هذه العملية؟",
    editTransaction: "تعديل العملية",
    viewTransaction: "عرض العملية",
    transactionDetails: "تفاصيل العملية",
    transactionDate: "تاريخ العملية",
    transactionTime: "وقت العملية",
    transactionStatus: "حالة العملية",
    completed: "مكتملة",
    pending: "معلقة",
    cancelled: "ملغية",
    exportTransactions: "تصدير العمليات",
    printTransaction: "طباعة العملية",
    filterByDate: "تصفية حسب التاريخ",
    filterByType: "تصفية حسب النوع",
    filterByCustomer: "تصفية حسب العميل",
    filterByAmount: "تصفية حسب المبلغ",
    clearFilters: "مسح الفلاتر",
    applyFilters: "تطبيق الفلاتر",
    fromAmount: "من مبلغ",
    toAmount: "إلى مبلغ",
    allCustomers: "جميع العملاء",
    allCurrencies: "جميع العملات",
    usd: "دولار أمريكي",
    try: "ليرة تركية",
    syp: "ليرة سورية",
    enterCustomerName: "أدخل اسم العميل",
    enterCustomerPhone: "أدخل رقم الهاتف",
    enterAmount: "أدخل المبلغ",
    enterDescription: "أدخل وصف العملية",
    enterReference: "أدخل رقم المرجع",
    selectTransactionType: "اختر نوع العملية",
    selectCurrency: "اختر العملة",
    selectCustomer: "اختر العميل",
    newCustomer: "عميل جديد",
    existingCustomer: "عميل مسجل",
    chooseCustomer: "اختر عميل...",
    pleaseEnterAmount: "يرجى إدخال المبلغ",
    pleaseEnterDescription: "يرجى إدخال وصف العملية",
    pleaseSelectType: "يرجى اختيار نوع العملية",
    pleaseSelectCurrency: "يرجى اختيار العملة",
    invalidAmount: "المبلغ غير صحيح",
    amountMustBePositive: "المبلغ يجب أن يكون موجباً",
    customerNotFound: "العميل غير موجود",
    createNewCustomer: "إنشاء عميل جديد",
    customerCreatedSuccess: "تم إنشاء العميل بنجاح",
    errorCreatingCustomer: "حدث خطأ أثناء إنشاء العميل",
    customerNameRequired: "اسم العميل مطلوب",
    customerPhoneRequired: "رقم هاتف العميل مطلوب",
    customerAlreadyExists: "العميل موجود بالفعل",
    financialSummary: "الملخص المالي",
    dailySummary: "ملخص يومي",
    monthlySummary: "ملخص شهري",
    yearlySummary: "ملخص سنوي",
    totalTransactions: "إجمالي العمليات",
    averageTransaction: "متوسط العملية",
    largestTransaction: "أكبر عملية",
    smallestTransaction: "أصغر عملية",
    mostActiveCustomer: "أكثر عميل نشاطاً",
    transactionHistory: "تاريخ العمليات",
    balanceHistory: "تاريخ الأرصدة",
    cashFlow: "تدفق النقدية",
    profitLoss: "الربح/الخسارة",
    revenue: "الإيرادات",
    costs: "التكاليف",
    netProfit: "صافي الربح",
    netLoss: "صافي الخسارة",
    breakEven: "نقطة التعادل",
    financialHealth: "الصحة المالية",
    excellent: "ممتازة",
    good: "جيدة",
    fair: "متوسطة",
    poor: "ضعيفة",
    critical: "حرجة",
    autoGenerated: "يتم توليده تلقائياً",
    referenceAutoGenerated: "رقم المرجع يتم توليده تلقائياً ولا يمكن تعديله",
    
    // Branch Transfers System
    branchTransfers: "عمليات الزمم بين الفروع",
    addTransfer: "إضافة عملية زمم",
    editTransfer: "تعديل العملية",
    transferType: "نوع العملية",
    sendTransfer: "إرسال حوالة",
    receiveTransfer: "استلام حوالة",
    confirmTransfer: "تأكيد دفع",
    fromBranch: "الفرع المرسل",
    toBranch: "الفرع المستقبل",
    transferNumber: "رقم الحوالة",
    transferDate: "تاريخ الحوالة",
    transferTime: "وقت الحوالة",
    totalSent: "إجمالي المرسل",
    totalReceived: "إجمالي المستقبل",
    pendingTransfers: "العمليات المعلقة",
    totalTransfers: "إجمالي العمليات",
    exportTransfers: "تصدير العمليات",
    searchTransfers: "البحث في العمليات...",
    noTransfers: "لا توجد عمليات زمم",
    addNewTransfer: "إضافة عملية زمم جديدة",
    transferAddedSuccess: "تم إضافة العملية بنجاح",
    errorAddingTransfer: "حدث خطأ أثناء إضافة العملية",
    transferUpdatedSuccess: "تم تحديث العملية بنجاح",
    errorUpdatingTransfer: "حدث خطأ أثناء تحديث العملية",
    transferDeletedSuccess: "تم حذف العملية بنجاح",
    errorDeletingTransfer: "حدث خطأ أثناء حذف العملية",
    confirmDeleteTransfer: "هل أنت متأكد من أنك تريد حذف هذه العملية؟",
    filterByFromBranch: "تصفية حسب الفرع المرسل",
    filterByToBranch: "تصفية حسب الفرع المستقبل",
    allBranches: "جميع الفروع",
    selectBranch: "اختر الفرع",
    pleaseSelectFromBranch: "يرجى اختيار الفرع المرسل",
    pleaseSelectToBranch: "يرجى اختيار الفرع المستقبل",
    branchesCannotBeSame: "الفرع المرسل والمستقبل لا يمكن أن يكونا نفس الفرع",
    transferNumberAutoGenerated: "رقم الحوالة يتم توليده تلقائياً ولا يمكن تعديله",
    confirmed: "مؤكد",
    completed: "مكتمل",
    noBranchesAvailable: "لا توجد فروع متاحة - يرجى إضافة فروع أولاً",
    pleaseAddBranchesFirst: "يرجى الذهاب إلى إدارة الفروع وإضافة فروع قبل إنشاء عمليات الزمم",
    goToBranchManagement: "الذهاب إلى إدارة الفروع",

    // Customers Management
    customersManagement: "إدارة العملاء",
    debtsManagement: "دفتر الديون",
    customerLedger: "كشف حساب العميل",
    customersManagementDescription: "إدارة العملاء وتتبع الديون والمدفوعات",
    totalCustomers: "إجمالي العملاء",
    activeCustomers: "العملاء النشطين",
    totalDebt: "إجمالي الديون",
    totalPaid: "إجمالي المدفوعات",
    searchCustomers: "البحث في العملاء...",
    allTypes: "جميع الأنواع",
    senders: "المرسلين",
    receivers: "المستلمين",
    addDebt: "تسجيل دين",
    addPayment: "تسجيل دفع",
    showing: "عرض",
    of: "من",
    transactions: "عمليات",
    both: "كلاهما",
    addCustomer: "إضافة عميل",
    customer: "العميل",
    type: "النوع",
    shipments: "الشحنات",
    balance: "الرصيد",
    lastShipment: "آخر شحنة",
    actions: "الإجراءات",
    sender: "مرسل",
    receiver: "مستلم",
    customerName: "اسم العميل",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    notes: "ملاحظات",
    add: "إضافة",
    cancel: "إلغاء",
    confirmDelete: "هل أنت متأكد من حذف هذا العميل؟",
    back: "رجوع",
  },
  
  en: {
    // Navigation
    newCustomer: "New Customer",
    existingCustomer: "Existing Customer",
    selectCustomer: "Select Customer",
    chooseCustomer: "Choose a customer...",
    home: "Home",
    trackShipment: "Track Your Shipment",
    about: "About Us",
    dashboard: "Dashboard",
    myShipments: "My Shipments",
    menu: "Menu",
    mainMenu: "Main Menu",
    logout: "Logout",
    login: "Login",
    switchLanguage: "Switch Language",
    
    // Menu Items
    createTrip: "Create Trip",
    branchEntries: "Branch Entries",
    manageDrivers: "Manage Drivers",
    driverCommissions: "Driver Commissions",
    
    // Sidebar Navigation
    shippingOperations: "Shipping Operations",
    tripOperations: "Trip Operations",
    vehicleManagement: "Vehicle Management",
    driversManagement: "Drivers and Commissions Management",
    administrativeOperations: "Administration and Control",
    
    // Sidebar Navigation
    shippingOperations: "Shipping Operations",
    tripOperations: "Trip Operations",
    vehicleManagement: "Vehicle Management",
    driversManagement: "Drivers and Commissions Management",
    administrativeOperations: "Administration and Control",
    
    // Driver Commissions Page
    driverCommissionsTitle: "Driver Commissions",
    backToDashboard: "Back to Dashboard",
    exportReport: "Export Report",
    howCommissionsWork: "How the Commission System Works",
    commissionCalculation: "Commission Calculation",
    commissionCalculationDesc: "Commissions are calculated based on the total shipping fees collected from shipments",
    commissionPercentage: "Commission Percentage",
    commissionPercentageDesc: "Each driver receives a specific percentage of the total shipping amount",
    commissionStatus: "Commission Status",
    commissionStatusDesc: "Shows \"Pending\" until manually changed to \"Paid\"",
    updateStatus: "Update Status",
    updateStatusDesc: "You can change the commission status using the buttons in the table",
    totalCommissions: "Total Commissions",
    paidCommissions: "Paid Commissions",
    pendingCommissions: "Pending Commissions",
    driver: "Driver",
    allDrivers: "All Drivers",
    status: "Status",
    allStatuses: "All Statuses",
    paid: "Paid",
    pending: "Pending",
    fromDate: "From Date",
    toDate: "To Date",
    showOnlyWithAmount: "Show only commissions with amounts",
    minimumAmount: "Minimum Amount (USD)",
    driverSummary: "Driver Summary",
    numberOfTrips: "Number of Trips",
    totalCommissionsAmount: "Total Commissions",
    paidAmount: "Paid",
    pendingAmount: "Pending",
    commissionsList: "Commissions List",
    showingCommissions: "Showing {count} of {total} commissions",
    loadingData: "Loading data...",
    noCommissions: "No driver commissions to display",
    ensureCommissions: "Make sure:",
    ensureCommissions1: "• There are trips with assigned drivers",
    ensureCommissions2: "• There are collected shipments in trips",
    ensureCommissions3: "• The specified filters are applied",
    tripName: "Trip Name",
    station: "Station",
    percentage: "Percentage",
    commissionAmount: "Commission Amount",
    totalShippingAmount: "Total Shipping Amount",
    assignedShipments: "Assigned Shipments",
    tripDate: "Trip Date",
    commissionDetails: "Commission Details",
    commissionDetailsDesc: "Commission Details:",
    driverLabel: "Driver:",
    tripLabel: "Trip:",
    stationLabel: "Station:",
    percentageLabel: "Percentage:",
    commissionAmountLabel: "Commission Amount:",
    totalShippingLabel: "Total Shipping Amount:",
    assignedShipmentsLabel: "Assigned Shipments:",
    statusLabel: "Status:",
    dateLabel: "Date:",
    close: "Close",
    clickForDetails: "Click to view commission details",
    changeToPending: "Change to Pending",
    changeToPaid: "Change to Paid",
    cancelPayment: "Cancel Payment",
    paymentCompleted: "Payment Completed",
    noAssignedShipments: "None",
    commissionUpdated: "Commission status updated to:",
    errorUpdatingCommission: "Error updating commission status.",
    commissionNotFound: "Commission not found.",
    
    // Station Information
    station1: "Station 1",
    stationInfo: "Station Information",
    stationName: "Station Name",
    enterStationName: "Enter station name",
    stationDescription: "Enter the station or city where the driver will deliver shipments",
    stationNameExample: "Example: Nicosia, Famagusta, Kyrenia",
    stationNameDesc: "Name of the city or station where shipments will be delivered",
    selectDriver: "Select Driver",
    selectDriverPlaceholder: "Choose driver...",
    percentageRequired: "Percentage",
    percentageRequiredDesc: "Commission percentage from shipping fees",
    responsibleShipments: "Responsible Shipments",
    responsibleShipmentsDesc: "Choose shipments that the driver will be responsible for",
    notes: "Notes",
    loadingDrivers: "Loading drivers...",
    loadingShipments: "Loading shipments...",
    specialNotes: "Special notes...",
    selectedDriverInfo: "Selected Driver Information:",
    name: "Name:",
    phone: "Phone:",
    area: "Area:",
    numberOfTrips: "Number of Trips:",
    shipmentsResponsibleFor: "Responsible Shipments:",
    notSpecified: "Not specified",
    optional: "Optional",
    notesDesc: "Add any special notes about this station",
    selectDriverDesc: "Choose the driver responsible for this station",
    shipmentCount: "Shipment Count",

    
    // Home Page
    companyName: "EXPRESS TRANSPORT COMPANY",
    companyLogo: "Company Logo",
    companyLogoLarge: "Large Company Logo",
    companySlogan: "Speed without haste, and mastery without shortcomings. Your trusted logistics partner for safe and timely delivery of your shipments.",
    trackNow: "Track Your Shipment Now",
    learnMore: "Learn More About Us",
    
    // Login Page
    welcomeToSystem: "Welcome to Express Transport System",
    loginToAccess: "Login to access the dashboard",
    email: "Email",
    password: "Password",
    loggingIn: "Logging in...",
    loginWithGoogle: "Login with Google",
    or: "or",
    noAccount: "Don't have an account?",
    createNewAccount: "Create a new account",
    loginFailed: "Login failed. Please check your email and password.",
    googleLoginFailed: "Google login failed.",
    emailNotVerified: "Your email is not verified. Please check your inbox.",
    accountCreatedSuccess: "Your account has been created successfully! Please check your email to verify your account before logging in.",
    
    // Dashboard
    shipmentsDashboard: "Shipments Dashboard",
    welcome: "Welcome,",
    shipmentsStatistics: "Shipments Statistics",
    shipmentsOverview: "Overview of shipment status in the system",
    totalShipments: "Total Shipments",
    pendingShipments: "Pending Shipments",
    inTransitShipments: "In Transit",
    deliveredShipments: "Delivered",
    quickActions: "Quick Actions",
    chooseOperation: "Choose the required operation from the list below",
    controlTools: "Control and Search Tools",
    searchShipments: "Search shipments and choose required operations",
    searchPlaceholder: "Search by shipment number, customer name, or delegate...",
    all: "All",
    pending: "Pending",
    inTransit: "In Transit",
    delivered: "Delivered",
    resetFilters: "Reset Filters",
    
    // Operations Sections
    shippingOperations: "Shipping Operations",
    newShipment: "New Shipment",
    manageShipments: "Manage Shipments",
    tripOperations: "Trip Operations",
    manageTrips: "Manage Trips",
    vehicleManagement: "Vehicle Management",
    manageVehicles: "Manage Vehicles",
    driversManagement: "Drivers and Commissions Management",
    driversWages: "Drivers' Wages",
    debtsManagement: "Debts Ledger",
    customerLedger: "Customer Ledger",
    addDebt: "Add Debt",
    addPayment: "Add Payment",
    showing: "Showing",
    of: "of",
    transactions: "transactions",
    accountingSystem: "Accounting System",
    administrativeOperations: "Administration and Control",
    manageBranches: "Manage Branches",
    manageUsers: "Manage Users",
    
    // Shipments List
    shipmentsList: "Shipments List",
    displayManageShipments: "View and manage all shipments in the system",
    loadingShipments: "Loading shipments...",
    shipmentNumber: "Shipment Number",
    customer: "Customer",
    governorate: "City",
    goodsValue: "Goods Value",
    collectibleAmount: "Collectible Amount",
    date: "Date",
    status: "Status",
    actions: "Actions",
    noShipments: "No shipments found",
    addNewShipment: "Add a new shipment to start working",
    addNewShipmentButton: "Add New Shipment",
    
    // Status
    pendingStatus: "Pending",
    inTransitStatus: "In Transit",
    deliveredStatus: "Delivered",
    
    // Actions
    print: "Print",
    copy: "Copy",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    add: "Add",
    remove: "Remove",
    update: "Update",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    
    // Messages
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
    loading: "Loading...",
    noData: "No data available",
    noResults: "No results found",
    copied: "Copied",
    deleted: "Deleted",
    saved: "Saved",
    updated: "Updated",
    
    // 404 Page
    pageNotFound: "Page Not Found",
    pageNotFoundDescription: "Sorry, the page you are looking for does not exist.",
    
    // About Page
    aboutTitle: "About Us",
    aboutDescription: "Express Transport Company is a leading company in the field of transport and shipping, providing integrated logistics services to our valued customers.",
    
    // Tracking Page
    trackYourShipment: "Track Your Shipment",
    enterShipmentNumberBelow: "Enter the shipment number below to know its status.",
    enterShipmentNumberHere: "Enter shipment number here...",
    track: "Track",
    searching: "Searching...",
    shipmentDetails: "Shipment Details",
    hello: "Hello",
    latestUpdates: "These are the latest updates for your shipment.",
    lastUpdate: "Last Update",
    pleaseEnterShipmentNumber: "Please enter the shipment number.",
    shipmentNotFound: "Sorry, no shipment found with this number.",
    errorFetchingShipmentData: "An error occurred while fetching shipment data.",
    
    // Shipment Form
    backToShipments: "Back to Shipments Management",
    editShipment: "Edit Shipment",
    basicInformation: "Basic Information",
    shipmentNumber: "Shipment Number",
    parcelType: "Parcel Type",
    enterParcelType: "Enter parcel type",
    customerInformation: "Recipient Information",
    customerName: "Recipient Name",
    customerPhone: "Recipient Phone",
    phoneNumber: "Phone Number",
    senderInformation: "Sender Information",
    senderName: "Sender Name",
    senderPhone: "Sender Phone",
    governorate: "City",
    weight: "Weight",
    parcelCount: "Parcel Count",
    goodsValue: "Goods Value",
    goodsCurrency: "Goods Currency",
    shippingFee: "Shipping Fee",
    shippingFeeCurrency: "Shipping Currency",
    shippingFeePaymentMethod: "Shipping Payment Method",
    transferFee: "Transfer Fee",
    transferFeeCurrency: "Transfer Currency",
    transferFeePaymentMethod: "Transfer Payment Method",
    internalTransferFee: "Internal Transfer Fee",
    internalTransferFeeCurrency: "Internal Transfer Currency",
    notes: "Notes",
    enterNotes: "Enter notes",
    collect: "Collect",
    prepaid: "Prepaid",
    locationAndPackageDetails: "Location and Package Details",
    selectGovernorate: "Select City",
    weightKg: "Weight (kg)",
    weightInKg: "Weight in kilograms",
    parcelCount: "Parcel Count",
    financialInformation: "Financial Information",
    usd: "US Dollar",
    try: "Turkish Lira",
    syp: "Syrian Lira",
    additionalNotes: "Additional Notes",
    anyAdditionalNotes: "Any additional notes...",
    updating: "Updating",
    adding: "Adding",
    updateShipment: "Update Shipment",
    addShipment: "Add Shipment",
    shipmentsManagement: "Shipments Management",
    backToDashboard: "Back to Dashboard",
    addNewShipment: "Add New Shipment",
    searchShipments: "Search shipments...",
    noShipments: "No shipments found. Add a new shipment.",
    deleteShipment: "Delete Shipment",
    copyTrackingLink: "Copy Tracking Link",
    confirmDeleteShipment: "Are you sure you want to delete this shipment permanently?",
    errorDeletingShipment: "Error occurred while deleting the shipment.",
    errorUpdatingStatus: "Error occurred while updating the status.",
    hideFilters: "Hide Filters",
    advancedFilters: "Advanced Filters",
    allShipments: "All Shipments",
    fromDate: "From Date",
    toDate: "To Date",
    allStatuses: "All Statuses",
    allGovernorates: "All Cities",
    allMethods: "All Methods",
    allVehicles: "All Vehicles",
    paymentMethod: "Payment Method",
    assignedVehicle: "Assigned Vehicle",
    notSpecified: "Not Specified",
    viewEditShipment: "View/Edit Shipment",
    noShipmentsMessage: "No shipments found. Add a new shipment.",
    statusReceived: "Received from sender",
    statusInTransit: "In Transit",
    statusArrived: "Arrived at destination",
    statusDelivered: "Delivered",
    statusReturned: "Returned",
    
    // Northern Cyprus Cities
    nicosia: "Nicosia",
    famagusta: "Famagusta",
    kyrenia: "Kyrenia",
    morphou: "Morphou",
    iskele: "Iskele",
    lefke: "Lefke",
    güzelyurt: "Güzelyurt",
    dipkarpaz: "Dipkarpaz",
    bogaz: "Bogaz",
    akdogan: "Akdogan",
    ercan: "Ercan",
    karpaz: "Karpaz",
    amount: "Amount",
    goToHome: "Home",
    
    // Manifest Page
    manifestTitle: "Customize Shipments for Trips",
    companyLogo: "Company Logo",
    createNewTrip: "Create New Trip",
    backToMainDashboard: "→ Back to Main Dashboard",
    selectShipments: "Select Shipments",
    selectedShipments: "Selected Shipment",
    chooseTrip: "Choose Trip...",
    assignShipments: "Assign Shipments",
    assigning: "Assigning...",
    searchShipmentsPlaceholder: "Search by shipment number, customer name, or city...",
    allShipments: "All Shipments",
    pending: "Pending",
    inTransit: "In Transit",
    delivered: "Delivered",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    loadingData: "Loading data...",
    select: "Select",
    shipmentNumber: "Shipment Number",
    customer: "Customer",
    governorate: "City",
    status: "Status",
    assignedTrip: "Assigned Trip",
    collectibleAmount: "Collectible Amount",
    notAssigned: "Not Assigned",
    noUnassignedShipments: "No unassigned shipments.",
    pleaseSelectShipment: "Please select at least one shipment.",
    pleaseChooseTrip: "Please choose a trip.",
    shipmentsAssignedSuccess: "Shipments assigned to the trip successfully!",
    trip: "Trip",
    addedShipments: "Number of shipments added",
    statusUpdatedToInTransit: "Status updated to \"In Transit\"",
    errorAssigningShipments: "Error occurred while assigning shipments.",
    notSpecified: "Not Specified",
    
    // Create Trip Page
    createNewTrip: "Create New Trip",
    backToTripsManagement: "Back to Trips Management",
    importantInformation: "Important Information:",
    totalShippingAmountAuto: "Total shipping amount will be calculated automatically from assigned shipments",
    commissionCalculated: "Commission will be calculated based on actual collected amount",
    commissionPercentagesEditable: "Commission percentages can be modified later in trip details page after knowing actual amount",
    tripName: "Trip Name",
    tripNamePlaceholder: "Example: Northern Cyprus - Istanbul Trip, Morning Trip",
    selectVehicle: "Select Vehicle",
    chooseVehicle: "Choose vehicle...",
    destination: "Trip Destination",
    destinationPlaceholder: "Example: Nicosia, Famagusta, Kyrenia",
    vehicleOwner: "Vehicle Owner Name",
    vehicleOwnerPlaceholder: "Vehicle owner name",
    departureDate: "Departure Date",
    departureTime: "Departure Time",
    importantNote: "Important Note:",
    totalAmountNote: "Total shipping amount will be calculated automatically from shipments you will assign to the trip later.",
    stationsAndDrivers: "Stations and Drivers",
    addStation: "Add Station",
    howStationsWork: "How Stations Work:",
    stationName: "Station Name: City where shipments will be delivered",
    stationOrder: "Station Order: Write stations in order from start to end",
    stationExample: "Example: Nicosia → Famagusta → Kyrenia → Morphou",
    stationDriverInfo: "Driver information and commission percentage must be entered separately for each station",
    noStations: "No stations. Add at least one station.",
    station: "Station",
    deleteStation: "Delete Station",
    additionalNotes: "Additional Notes",
    additionalNotesPlaceholder: "Any additional notes about the trip...",
    tripStatus: "Trip Status",
    waiting: "Waiting",
    inTransit: "In Transit",
    delivered: "Delivered",
    cancel: "Cancel",
    creating: "Creating...",
    createTrip: "Create Trip",
    loadingVehicles: "Loading vehicles...",
    pleaseEnterTripName: "Please enter trip name.",
    pleaseSelectVehicle: "Please select a vehicle for the trip.",
    pleaseEnterDestination: "Please specify trip destination.",
    pleaseEnterOwnerName: "Please specify vehicle owner name.",
    pleaseAddStation: "Please add at least one station.",
    pleaseCompleteStationData: "Please complete all required data for station",
    tripCreatedSuccess: "Trip created successfully! You can now assign shipments to this trip.",
    errorCreatingTrip: "Error occurred while creating trip.",
    trip: "Trip",
    new: "New",
    totalShippingAmount: "Total Shipping Amount",
    willBeCalculatedAutomatically: "will be calculated automatically from assigned shipments",
    commission: "Commission",
    willBeCalculatedBasedOnActual: "will be calculated based on actual collected amount",
    commissionRates: "Commission Rates",
    canBeAdjustedLater: "can be adjusted later in trip details page after knowing actual amount",
    stationName: "Station Name",
    theCityWhereShipments: "the city where shipments will be delivered",
    stationOrder: "Station Order",
    writeStationsInOrder: "write stations in order from start to end",
    example: "Example",
    aleppoHomsLattakiaDamascus: "Nicosia → Famagusta → Kyrenia → Morphou",
    youMustEnterDriver: "You must enter driver information and commission percentage for each station separately",
    noStationsAdded: "No stations. Add at least one station.",
    returnToTripManagement: "Back to Trips Management",
     
    // Trips Management Page
    tripsManagement: "Trips Management",
    backToDashboard: "Back to Dashboard",
    createNewTrip: "Create New Trip",
    totalTrips: "Total Trips",
    tripsWithShipments: "Trips with Shipments",
    waiting: "Waiting",
    inTransit: "In Transit",
    hideFilters: "Hide Filters",
    advancedFilters: "Advanced Filters",
    showingTrips: "Showing",
    of: "of",
    trip: "Trip",
    fromDate: "From Date",
    toDate: "To Date",
    status: "Status",
    allStatuses: "All Statuses",
    vehicle: "Vehicle",
    allVehicles: "All Vehicles",
    destination: "Destination",
    allDestinations: "All Destinations",
    clearAllFilters: "Clear All Filters",
    loadingTrips: "Loading trips...",
    tripName: "Trip Name",
    vehicleOwner: "Vehicle Owner",
    creationDate: "Creation Date",
    shipmentCount: "Shipment Count",
    totalCollections: "Total Collections",
    actions: "Actions",
    viewDetails: "View Details",
    confirmDeleteTrip: "Are you sure you want to delete this trip?",
    noteShipmentsReturned: "Note: Assigned shipments will be returned to pending status.",
    tripDeletedSuccess: "Trip deleted successfully!",
    shipmentsReturnedToPending: "Shipments returned to",
    shipmentsToPending: "shipment to pending.",
    checkShipmentsPage: "You can check shipments in the shipments management page.",
    errorDeletingTrip: "Error occurred while deleting the trip:",
    goToShipmentsPage: "Would you like to navigate to the shipments management page to check shipment status?",
    noTrips: "No trips found. Create a new trip.",
    planned: "Planned",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    notSpecified: "Not Specified",
    driver: "Driver",
    departureDate: "Departure Date",
    numberOfShipments: "Number of Shipments",
    noTripsFound: "No trips found. Create a new trip.",
    
    // Trip Details Page Excel Export
    tripOverview: "Trip Overview",
    information: "Information",
    details: "Details",
    tripDetailsReport: "Trip Details Report",
    tripNumber: "Trip Number",
    vehicle: "Vehicle",
    vehicleNumber: "Vehicle Number",
    tripStatus: "Trip Status",
    createdBy: "Created By",
    updateDate: "Update Date",
    generalNotes: "General Notes",
    none: "None",
    financialSummary: "Financial Summary",
    totalExpenses: "Total Expenses",
    netProfit: "Net Profit",
    numberOfDispatchedItems: "Number of Dispatched Items",
    numberOfDrivers: "Number of Drivers",
    shipmentDetails: "Shipment Details",
    shipmentNumber: "Shipment Number",
    senderName: "Sender Name",
    receiverName: "Receiver Name",
    receiverPhone: "Receiver Phone",
    receiverAddress: "Receiver Address",
    goodsCurrency: "Goods Currency",
    shippingFee: "Shipping Fee",
    shippingCurrency: "Shipping Currency",
    transferFee: "Transfer Fee",
    transferCurrency: "Transfer Currency",
    shippingPaymentMethod: "Shipping Payment Method",
    totalCollectible: "Total Collectible",
    collect: "Collect",
    prepaid: "Prepaid",
    shipmentsAssociatedWithTrip: "Shipments Associated with Trip",
    noShipmentsAssociatedWithTrip: "No shipments associated with this trip",
    stationsAndDrivers: "Stations and Drivers",
    stationsAndDriversDetails: "Stations and Drivers Details",
    station: "Station",
    driverName: "Driver Name",
    driverPhone: "Driver Phone",
    commissionPercentage: "Commission Percentage",
    commissionAmount: "Commission Amount",
    noStationsSpecifiedForTrip: "No stations specified for this trip",
    expenseDetails: "Expense Details",
    tripExpenseDetails: "Trip Expense Details",
    expenseType: "Expense Type",
    amount: "Amount",
    currency: "Currency",
    notes: "Notes",
    vehicleRental: "Vehicle Rental",
    vehicleRentalForTrip: "Vehicle Rental for Trip",
    fixedExpense: "Fixed Expense",
    additionalExpense1: "Additional Expense 1",
    additionalExpense2: "Additional Expense 2",
    additionalExpense: "Additional Expense",
    officeExpenses: "Office Expenses",
    vehicleExpenses: "Vehicle Expenses",
    administrativeExpenses: "Administrative Expenses",
    operationalExpenses: "Operational Expenses",
    dispatchedItems: "Dispatched Items",
    dispatchedItemsFromBranchEntries: "Dispatched Items from Branch Entries",
    itemNumber: "Item Number",
    itemName: "Item Name",
    quantity: "Quantity",
    itemValue: "Item Value",
    originalEntryNumber: "Original Entry Number",
    loadingTripDetails: "Loading trip details...",
    noDataToDisplay: "No data to display",
    exportExcel: "Export Excel",
    printReceipt: "Print Receipt",
    backToTripsList: "Back to Trips List",
    deleteTrip: "Delete Trip",
    tripInformation: "Trip Information",
    changeStatusOfAggregatedTrip: "Change status of this aggregated trip",
    tripStationsAndDelegates: "Trip Stations and Delegates",
    editCommissionRates: "Edit Commission Rates",
    station: "Station",
    responsibleDelegate: "Responsible Delegate",
    commissionPercentage: "Commission Percentage",
    commissionAmount: "Commission Amount",
    notes: "Notes",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    totalShippingAmount: "Total Shipping Amount",
    editCommissionRatesTip: "💡 You can edit commission rates based on the actual amount collected from shipments",
    financialSummary: "Financial Summary",
    totalCollections: "Total Collections",
    totalExpenses: "Total Expenses",
    netProfitLoss: "Net Profit/Loss",
    expenseManagement: "Additional Expense Management",
    shippingFeesSummary: "Shipping Fees Summary",
    totalShippingFeesForCollection: "Total Shipping Fees (for collection)",
    vehicleRentalUSD: "Vehicle Rental (USD)",
    additionalExpense1Name: "Additional Expense 1 (Name)",
    additionalExpense1Value: "Additional Expense 1 (Value)",
    additionalExpense2Name: "Additional Expense 2 (Name)",
    additionalExpense2Value: "Additional Expense 2 (Value)",
    saveExpenses: "Save Expenses",
    saving: "Saving...",
    shipmentsInThisTrip: "Shipments in this Trip",
    customer: "Customer",
    phone: "Phone",
    governorate: "Governorate",
    collectibleAmount: "Collectible Amount",
    dispatchedItemsFromBranchEntries: "Dispatched Items from Branch Entries in this Trip",
    fromEntry: "From Entry",
    viewOriginalEntry: "View Original Entry",
    itemDescription: "Description",
    dispatchedAmount: "Dispatched Amount",
    recipientName: "Recipient Name",
    destinationGovernorate: "Destination Governorate",
    printTripReceipt: "Print Trip Receipt",
    print: "Print",
    close: "Close",
    
    // Admin Page
    manageUsers: "Manage Users",
    usersList: "Users List",
    addNewUser: "Add New User",
    loadingUsers: "Loading users...",
    noUsersToDisplay: "No users to display",
    roleUpdatedSuccess: "Role updated successfully",
    errorUpdatingRole: "Error updating role",
    confirmDeleteUser: "Are you sure you want to delete this user? This action cannot be undone",
    userDeletedSuccess: "User deleted successfully",
    errorDeletingUser: "Error deleting user",
    addNewEmployee: "Add New Employee",
    employeeEmail: "Employee Email",
    permission: "Permission",
    pleaseEnterEmail: "Please enter email",
    emailAlreadyExists: "This email is already registered",
    emailAlreadyRegistered: "This email is already registered",
    userAddedSuccess: "User added successfully",
    errorAddingUser: "Error adding user",
    adding: "Adding",
    adminYou: "Admin (You)",

    // Accounting System
    accountingSystem: "Accounting System",
    dailyJournal: "Daily Journal",
    financialTransactions: "Financial Transactions",
    addTransaction: "Add Transaction",
    transactionType: "Transaction Type",
    income: "Income",
    expense: "Expense",
    refund: "Refund",
    allTypes: "All Types",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    amount: "Amount",
    currency: "Currency",
    description: "Description",
    reference: "Reference Number",
    currentBalance: "Current Balance",
    balanceAfter: "Balance After",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    totalRefunds: "Total Refunds",
    netBalance: "Net Balance",
    todayTransactions: "Today's Transactions",
    thisMonthTransactions: "This Month's Transactions",
    searchTransactions: "Search transactions...",
    noTransactions: "No financial transactions",
    addNewTransaction: "Add New Transaction",
    transactionAddedSuccess: "Transaction added successfully",
    errorAddingTransaction: "Error adding transaction",
    transactionUpdatedSuccess: "Transaction updated successfully",
    errorUpdatingTransaction: "Error updating transaction",
    transactionDeletedSuccess: "Transaction deleted successfully",
    errorDeletingTransaction: "Error deleting transaction",
    confirmDeleteTransaction: "Are you sure you want to delete this transaction?",
    editTransaction: "Edit Transaction",
    viewTransaction: "View Transaction",
    transactionDetails: "Transaction Details",
    transactionDate: "Transaction Date",
    transactionTime: "Transaction Time",
    transactionStatus: "Transaction Status",
    completed: "Completed",
    pending: "Pending",
    cancelled: "Cancelled",
    exportTransactions: "Export Transactions",
    printTransaction: "Print Transaction",
    filterByDate: "Filter by Date",
    filterByType: "Filter by Type",
    filterByCustomer: "Filter by Customer",
    filterByAmount: "Filter by Amount",
    clearFilters: "Clear Filters",
    applyFilters: "Apply Filters",
    fromAmount: "From Amount",
    toAmount: "To Amount",
    allCustomers: "All Customers",
    allCurrencies: "All Currencies",
    usd: "US Dollar",
    try: "Turkish Lira",
    syp: "Syrian Lira",
    enterCustomerName: "Enter customer name",
    enterCustomerPhone: "Enter phone number",
    enterAmount: "Enter amount",
    enterDescription: "Enter transaction description",
    enterReference: "Enter reference number",
    selectTransactionType: "Select transaction type",
    selectCurrency: "Select currency",
    selectCustomer: "Select customer",
    pleaseEnterAmount: "Please enter amount",
    pleaseEnterDescription: "Please enter description",
    pleaseSelectType: "Please select transaction type",
    pleaseSelectCurrency: "Please select currency",
    invalidAmount: "Invalid amount",
    amountMustBePositive: "Amount must be positive",
    customerNotFound: "Customer not found",
    createNewCustomer: "Create New Customer",
    customerCreatedSuccess: "Customer created successfully",
    errorCreatingCustomer: "Error creating customer",
    customerNameRequired: "Customer name is required",
    customerPhoneRequired: "Customer phone is required",
    customerAlreadyExists: "Customer already exists",
    financialSummary: "Financial Summary",
    dailySummary: "Daily Summary",
    monthlySummary: "Monthly Summary",
    yearlySummary: "Yearly Summary",
    totalTransactions: "Total Transactions",
    averageTransaction: "Average Transaction",
    largestTransaction: "Largest Transaction",
    smallestTransaction: "Smallest Transaction",
    mostActiveCustomer: "Most Active Customer",
    transactionHistory: "Transaction History",
    balanceHistory: "Balance History",
    cashFlow: "Cash Flow",
    profitLoss: "Profit/Loss",
    revenue: "Revenue",
    costs: "Costs",
    netProfit: "Net Profit",
    netLoss: "Net Loss",
    breakEven: "Break Even",
    financialHealth: "Financial Health",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    critical: "Critical",
    autoGenerated: "Auto Generated",
    referenceAutoGenerated: "Reference number is auto-generated and cannot be modified",
    
    // Branch Transfers System
    branchTransfers: "Branch Transfers",
    addTransfer: "Add Transfer",
    editTransfer: "Edit Transfer",
    transferType: "Transfer Type",
    sendTransfer: "Send Transfer",
    receiveTransfer: "Receive Transfer",
    confirmTransfer: "Confirm Payment",
    fromBranch: "From Branch",
    toBranch: "To Branch",
    transferNumber: "Transfer Number",
    transferDate: "Transfer Date",
    transferTime: "Transfer Time",
    totalSent: "Total Sent",
    totalReceived: "Total Received",
    pendingTransfers: "Pending Transfers",
    totalTransfers: "Total Transfers",
    exportTransfers: "Export Transfers",
    searchTransfers: "Search transfers...",
    noTransfers: "No branch transfers",
    addNewTransfer: "Add New Transfer",
    transferAddedSuccess: "Transfer added successfully",
    errorAddingTransfer: "Error adding transfer",
    transferUpdatedSuccess: "Transfer updated successfully",
    errorUpdatingTransfer: "Error updating transfer",
    transferDeletedSuccess: "Transfer deleted successfully",
    errorDeletingTransfer: "Error deleting transfer",
    confirmDeleteTransfer: "Are you sure you want to delete this transfer?",
    filterByFromBranch: "Filter by From Branch",
    filterByToBranch: "Filter by To Branch",
    allBranches: "All Branches",
    selectBranch: "Select Branch",
    pleaseSelectFromBranch: "Please select from branch",
    pleaseSelectToBranch: "Please select to branch",
    branchesCannotBeSame: "From and to branches cannot be the same",
    transferNumberAutoGenerated: "Transfer number is auto-generated and cannot be modified",
    confirmed: "Confirmed",
    completed: "Completed",
    noBranchesAvailable: "No branches available - please add branches first",
    pleaseAddBranchesFirst: "Please go to branch management and add branches before creating transfers",
    goToBranchManagement: "Go to Branch Management",

    // Customers Management
    customersManagement: "Customers Management",
    customersManagementDescription: "Manage customers and track debts and payments",
    totalCustomers: "Total Customers",
    activeCustomers: "Active Customers",
    totalDebt: "Total Debt",
    totalPaid: "Total Paid",
    searchCustomers: "Search customers...",
    allTypes: "All Types",
    senders: "Senders",
    receivers: "Receivers",
    both: "Both",
    addCustomer: "Add Customer",
    customer: "Customer",
    type: "Type",
    shipments: "Shipments",
    balance: "Balance",
    lastShipment: "Last Shipment",
    actions: "Actions",
    sender: "Sender",
    receiver: "Receiver",
    customerName: "Customer Name",
    phone: "Phone",
    email: "Email",
    address: "Address",
    notes: "Notes",
    add: "Add",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this customer?",
    back: "Back",
  }
};

// Translation function
export const t = (key, language = 'en') => {
  return translations[language]?.[key] || key;
};

// Translation function with variables
export const tWithVars = (key, vars = {}, language = 'en') => {
  let text = translations[language]?.[key] || key;
  Object.keys(vars).forEach(varKey => {
    text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), vars[varKey]);
  });
  return text;
};
