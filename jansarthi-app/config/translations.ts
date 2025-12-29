/**
 * Translation configuration for Jansarthi App
 * Contains all text translations in English and Hindi
 */

export type Language = "en" | "hi";

export interface Translation {
  en: string;
  hi: string;
}

export interface Translations {
  // Common
  appName: Translation;

  // Location
  location: {
    loading: Translation;
    denied: Translation;
    error: Translation;
    unavailable: Translation;
    change: Translation;
  };

  // Map
  map: {
    loadingLocation: Translation;
    loadingAddress: Translation;
    permissionDenied: Translation;
    locationError: Translation;
    enableLocationInstructions: Translation;
    yourLocation: Translation;
    unsupportedPlatform: Translation;
  };

  // Menu Screen
  menu: {
    welcome: Translation;
    subtitle: Translation;
    createReport: Translation;
    createReportDesc: Translation;
    viewReports: Translation;
    viewReportsDesc: Translation;
    viewMap: Translation;
    viewMapDesc: Translation;
    quickActions: Translation;
    selectIssueType: Translation;
    selectIssueTypeDesc: Translation;
  };

  // Quick Actions
  quickActions: {
    viewReports: Translation;
    viewMap: Translation;
    jalSamasya: Translation;
    bijliSamasya: Translation;
    sadakSamasya: Translation;
    kachraSamasya: Translation;
  };

  // Issue Types
  issueTypes: {
    jalSamasya: Translation;
    bijliSamasya: Translation;
    sadakSamasya: Translation;
    kachraSamasya: Translation;
    severageSamasya: Translation;
  };

  // Language
  language: {
    english: Translation;
    hindi: Translation;
    selectLanguage: Translation;
  };

  // Camera/Photo
  camera: {
    cameraPermission: Translation;
    cameraPermissionDenied: Translation;
    cameraPermissionInstructions: Translation;
    grantPermission: Translation;
    takePhoto: Translation;
    retakePhoto: Translation;
    removePhoto: Translation;
    addPhoto: Translation;
    photoAttached: Translation;
    flipCamera: Translation;
    capturePhoto: Translation;
    photos: Translation;
    attachPhotos: Translation;
    attachPhotosDesc: Translation;
    maxPhotosReached: Translation;
  };

  // Form Fields
  form: {
    title: Translation;
    titlePlaceholder: Translation;
    description: Translation;
    descriptionPlaceholder: Translation;
    required: Translation;
    optional: Translation;
    issueDetails: Translation;
  };

  // Common Actions
  actions: {
    submit: Translation;
    cancel: Translation;
    edit: Translation;
    delete: Translation;
    view: Translation;
    back: Translation;
    next: Translation;
    save: Translation;
    refresh: Translation;
    tryAgain: Translation;
    logout: Translation;
  };

  // Auth Pages
  auth: {
    login: {
      title: Translation;
      subtitle: Translation;
      mobileNumber: Translation;
      mobileNumberPlaceholder: Translation;
      sendOtp: Translation;
      sendingOtp: Translation;
      dontHaveAccount: Translation;
      signUp: Translation;
      enterMobileNumber: Translation;
      enterValidMobileNumber: Translation;
    };
    signup: {
      title: Translation;
      subtitle: Translation;
      fullName: Translation;
      fullNamePlaceholder: Translation;
      mobileNumber: Translation;
      mobileNumberPlaceholder: Translation;
      signUp: Translation;
      creatingAccount: Translation;
      alreadyHaveAccount: Translation;
      login: Translation;
      enterName: Translation;
      enterMobileNumber: Translation;
    };
    verifyOtp: {
      title: Translation;
      subtitle: Translation;
      otpExpiresIn: Translation;
      minutes: Translation;
      enterOtpPlaceholder: Translation;
      verifyOtp: Translation;
      verifying: Translation;
      resendOtpIn: Translation;
      resendOtp: Translation;
      changeNumber: Translation;
      enterOtp: Translation;
      otpMustBe6Digits: Translation;
    };
  };

  // Profile Page
  profile: {
    title: Translation;
    loadingProfile: Translation;
    failedToLoad: Translation;
    noUserData: Translation;
    verifiedAccount: Translation;
    accountInformation: Translation;
    mobileNumber: Translation;
    memberSince: Translation;
    refreshProfile: Translation;
    refreshing: Translation;
    logout: Translation;
    logoutConfirm: Translation;
    logoutConfirmMessage: Translation;
    logoutButton: Translation;
  };

  // My Reports Page
  myReports: {
    title: Translation;
    loadingReports: Translation;
    noReports: Translation;
    noReportsMessage: Translation;
    reportedOn: Translation;
    lastUpdated: Translation;
  };

  // Report Detail Page
  reportDetail: {
    title: Translation;
    loadingDetails: Translation;
    reportNotFound: Translation;
    progressStatus: Translation;
    description: Translation;
    attachedPhotos: Translation;
    reportInformation: Translation;
    reportedOn: Translation;
    lastUpdated: Translation;
  };

  // Issues Map Page
  issuesMap: {
    title: Translation;
    initializingMap: Translation;
    gettingLocation: Translation;
    loadingIssues: Translation;
    locationRequired: Translation;
    locationRequiredMessage: Translation;
    issuesCount: Translation;
    issue: Translation;
    issues: Translation;
    of: Translation;
    filters: Translation;
    water: Translation;
    electricity: Translation;
    road: Translation;
    garbage: Translation;
    status: Translation;
  };

  // Ward Selection
  ward: {
    selectWard: Translation;
    selectYourWard: Translation;
    searchPlaceholder: Translation;
    noWardsFound: Translation;
    parshad: Translation;
    viewMap: Translation;
    wardNumber: Translation;
  };

  // Status Labels
  status: {
    reported: Translation;
    assigned: Translation;
    parshadCheck: Translation;
    startedWorking: Translation;
    finishedWork: Translation;
    parshad: Translation;
    pwdClerkStartedWorking: Translation;
    finishedWorking: Translation;
  };

  // Parshad Dashboard
  parshad: {
    dashboard: {
      title: Translation;
      welcome: Translation;
      totalAssigned: Translation;
      pendingAcknowledgement: Translation;
      inProgress: Translation;
      completed: Translation;
      issuesByType: Translation;
      noIssuesAssigned: Translation;
      noIssuesAssignedMessage: Translation;
    };
    issues: {
      title: Translation;
      pending: Translation;
      inProgress: Translation;
      completed: Translation;
      all: Translation;
      viewDetails: Translation;
      acknowledge: Translation;
      startWork: Translation;
      markComplete: Translation;
      updateProgress: Translation;
      acknowledging: Translation;
      startingWork: Translation;
      completing: Translation;
      updating: Translation;
    };
    issueDetail: {
      title: Translation;
      reportedBy: Translation;
      assignmentNotes: Translation;
      progressNotes: Translation;
      addProgressNote: Translation;
      progressNotePlaceholder: Translation;
      attachPhotos: Translation;
      attachPhotosDesc: Translation;
      submitUpdate: Translation;
      submitting: Translation;
      selectNewStatus: Translation;
    };
    status: {
      acknowledgeConfirm: Translation;
      startWorkConfirm: Translation;
      completeConfirm: Translation;
      statusUpdated: Translation;
    };
  };
}

export const translations: Translations = {
  // Common
  appName: {
    en: "Jansarthi",
    hi: "जनसारथी",
  },

  // Location
  location: {
    loading: {
      en: "Getting location...",
      hi: "स्थान प्राप्त हो रहा है...",
    },
    denied: {
      en: "Location access denied",
      hi: "स्थान अभिगम अस्वीकृत",
    },
    error: {
      en: "Unable to get location",
      hi: "स्थान प्राप्त नहीं हो सका",
    },
    unavailable: {
      en: "Location unavailable",
      hi: "स्थान अनुपलब्ध",
    },
    change: {
      en: "Change",
      hi: "बदलें",
    },
  },

  // Map
  map: {
    loadingLocation: {
      en: "Loading your location...",
      hi: "आपका स्थान लोड हो रहा है...",
    },
    loadingAddress: {
      en: "Loading address...",
      hi: "पता लोड हो रहा है...",
    },
    permissionDenied: {
      en: "Location permission denied",
      hi: "स्थान अनुमति अस्वीकृत",
    },
    locationError: {
      en: "Unable to get your location",
      hi: "आपका स्थान प्राप्त नहीं हो सका",
    },
    enableLocationInstructions: {
      en: "Please enable location services in your device settings",
      hi: "कृपया अपने डिवाइस सेटिंग्स में स्थान सेवाएं सक्षम करें",
    },
    yourLocation: {
      en: "Your Location",
      hi: "आपका स्थान",
    },
    unsupportedPlatform: {
      en: "Maps are only available on Android and iOS",
      hi: "मानचित्र केवल Android और iOS पर उपलब्ध हैं",
    },
  },

  // Menu Screen
  menu: {
    welcome: {
      en: "Welcome to Jansarthi",
      hi: "जनसारथी में आपका स्वागत है",
    },
    subtitle: {
      en: "Report and track issues in your area",
      hi: "अपने क्षेत्र में समस्याओं की रिपोर्ट करें और ट्रैक करें",
    },
    createReport: {
      en: "Create New Report",
      hi: "नई रिपोर्ट बनाएं",
    },
    // TODO: Make Hindi Samsaya ko
    createReportDesc: {
      en: "Report an issue",
      hi: "समस्या की रिपोर्ट करें",
    },
    viewReports: {
      en: "My Reports",
      hi: "मेरी रिपोर्ट्स",
    },
    viewReportsDesc: {
      en: "View and track your submitted reports",
      hi: "अपनी सबमिट की गई रिपोर्ट देखें और ट्रैक करें",
    },
    viewMap: {
      en: "View Map",
      hi: "मानचित्र देखें",
    },
    viewMapDesc: {
      en: "See all reports in your city on map",
      hi: "मानचित्र पर अपने शहर की सभी रिपोर्ट देखें",
    },
    quickActions: {
      en: "Quick Actions",
      hi: "त्वरित कार्य",
    },
    selectIssueType: {
      en: "Select Issue Type",
      hi: "समस्या का प्रकार चुनें",
    },
    selectIssueTypeDesc: {
      en: "Choose the type of issue you want to report",
      hi: "जिस प्रकार की समस्या आप रिपोर्ट करना चाहते हैं उसे चुनें",
    },
  },

  // Quick Actions
  quickActions: {
    viewReports: {
      en: "My Reports",
      hi: "मेरी रिपोर्ट्स",
    },
    viewMap: {
      en: "View Map",
      hi: "मानचित्र देखें",
    },
    jalSamasya: {
      en: "Water Issue",
      hi: "जल समस्या",
    },
    bijliSamasya: {
      en: "Electricity Issue",
      hi: "बिजली समस्या",
    },
    sadakSamasya: {
      en: "Road Issue",
      hi: "सड़क समस्या",
    },
    kachraSamasya: {
      en: "Garbage Issue",
      hi: "कचरा समस्या",
    },
  },

  // Issue Types
  issueTypes: {
    jalSamasya: {
      en: "Water Issue",
      hi: "जल समस्या",
    },
    bijliSamasya: {
      en: "Electricity Issue",
      hi: "बिजली समस्या",
    },
    sadakSamasya: {
      en: "Road Issue",
      hi: "सड़क समस्या",
    },
    kachraSamasya: {
      en: "Garbage Issue",
      hi: "कचरा समस्या",
    },
    severageSamasya: {
      en: "Sewerage Issue",
      hi: "सीवरेज समस्या",
    },
  },

  // Language
  language: {
    english: {
      en: "English",
      hi: "अंग्रेज़ी",
    },
    hindi: {
      en: "Hindi",
      hi: "हिंदी",
    },
    selectLanguage: {
      en: "Select Language",
      hi: "भाषा चुनें",
    },
  },

  // Camera/Photo
  camera: {
    cameraPermission: {
      en: "We need your permission to use the camera",
      hi: "हमें कैमरा उपयोग करने के लिए आपकी अनुमति चाहिए",
    },
    cameraPermissionDenied: {
      en: "Camera permission denied",
      hi: "कैमरा अनुमति अस्वीकृत",
    },
    cameraPermissionInstructions: {
      en: "Please enable camera access in your device settings",
      hi: "कृपया अपने डिवाइस सेटिंग्स में कैमरा एक्सेस सक्षम करें",
    },
    grantPermission: {
      en: "Grant Permission",
      hi: "अनुमति दें",
    },
    takePhoto: {
      en: "Take Photo",
      hi: "फोटो लें",
    },
    retakePhoto: {
      en: "Retake Photo",
      hi: "फिर से फोटो लें",
    },
    removePhoto: {
      en: "Remove Photo",
      hi: "फोटो हटाएं",
    },
    addPhoto: {
      en: "Add Photo",
      hi: "फोटो जोड़ें",
    },
    photoAttached: {
      en: "Photo Attached",
      hi: "फोटो संलग्न है",
    },
    flipCamera: {
      en: "Flip Camera",
      hi: "कैमरा पलटें",
    },
    capturePhoto: {
      en: "Capture Photo",
      hi: "फोटो कैप्चर करें",
    },
    photos: {
      en: "Photos",
      hi: "फोटो",
    },
    attachPhotos: {
      en: "Attach Photos",
      hi: "फोटो संलग्न करें",
    },
    attachPhotosDesc: {
      en: "Add photos of the issue (up to 3)",
      hi: "समस्या की फोटो जोड़ें (अधिकतम 3)",
    },
    maxPhotosReached: {
      en: "Maximum 3 photos allowed",
      hi: "अधिकतम 3 फोटो की अनुमति है",
    },
  },

  // Form Fields
  form: {
    title: {
      en: "Title",
      hi: "शीर्षक",
    },
    titlePlaceholder: {
      en: "Enter a brief title for the issue",
      hi: "समस्या के लिए संक्षिप्त शीर्षक दर्ज करें",
    },
    description: {
      en: "Description",
      hi: "विवरण",
    },
    descriptionPlaceholder: {
      en: "Describe the issue in detail",
      hi: "समस्या का विस्तार से वर्णन करें",
    },
    required: {
      en: "Required",
      hi: "आवश्यक",
    },
    optional: {
      en: "Optional",
      hi: "वैकल्पिक",
    },
    issueDetails: {
      en: "Issue Details",
      hi: "समस्या विवरण",
    },
  },

  // Common Actions
  actions: {
    submit: {
      en: "Submit",
      hi: "सबमिट करें",
    },
    cancel: {
      en: "Cancel",
      hi: "रद्द करें",
    },
    edit: {
      en: "Edit",
      hi: "संपादित करें",
    },
    delete: {
      en: "Delete",
      hi: "हटाएं",
    },
    view: {
      en: "View",
      hi: "देखें",
    },
    back: {
      en: "Back",
      hi: "वापस",
    },
    next: {
      en: "Next",
      hi: "अगला",
    },
    save: {
      en: "Save",
      hi: "सहेजें",
    },
    refresh: {
      en: "Refresh",
      hi: "रीफ्रेश करें",
    },
    tryAgain: {
      en: "Try Again",
      hi: "फिर से प्रयास करें",
    },
    logout: {
      en: "Logout",
      hi: "लॉगआउट",
    },
  },

  // Auth Pages
  auth: {
    login: {
      title: {
        en: "Welcome Back",
        hi: "वापसी पर स्वागत है",
      },
      subtitle: {
        en: "Enter your mobile number to login",
        hi: "लॉगिन करने के लिए अपना मोबाइल नंबर दर्ज करें",
      },
      mobileNumber: {
        en: "Mobile Number",
        hi: "मोबाइल नंबर",
      },
      mobileNumberPlaceholder: {
        en: "Phone number",
        hi: "फ़ोन नंबर",
      },
      sendOtp: {
        en: "Send OTP",
        hi: "OTP भेजें",
      },
      sendingOtp: {
        en: "Sending OTP...",
        hi: "OTP भेजा जा रहा है...",
      },
      dontHaveAccount: {
        en: "Don't have an account?",
        hi: "खाता नहीं है?",
      },
      signUp: {
        en: "Sign Up",
        hi: "साइन अप करें",
      },
      enterMobileNumber: {
        en: "Please enter your mobile number",
        hi: "कृपया अपना मोबाइल नंबर दर्ज करें",
      },
      enterValidMobileNumber: {
        en: "Please enter a valid 10-digit mobile number",
        hi: "कृपया एक वैध 10-अंकीय मोबाइल नंबर दर्ज करें",
      },
    },
    signup: {
      title: {
        en: "Create Account",
        hi: "खाता बनाएं",
      },
      subtitle: {
        en: "Enter your details to get started",
        hi: "शुरू करने के लिए अपना विवरण दर्ज करें",
      },
      fullName: {
        en: "Full Name",
        hi: "पूरा नाम",
      },
      fullNamePlaceholder: {
        en: "Full Name",
        hi: "पूरा नाम",
      },
      mobileNumber: {
        en: "Mobile Number",
        hi: "मोबाइल नंबर",
      },
      mobileNumberPlaceholder: {
        en: "Mobile Number",
        hi: "मोबाइल नंबर",
      },
      signUp: {
        en: "Sign Up",
        hi: "साइन अप करें",
      },
      creatingAccount: {
        en: "Creating Account...",
        hi: "खाता बनाया जा रहा है...",
      },
      alreadyHaveAccount: {
        en: "Already have an account?",
        hi: "पहले से खाता है?",
      },
      login: {
        en: "Login",
        hi: "लॉगिन करें",
      },
      enterName: {
        en: "Please enter your name",
        hi: "कृपया अपना नाम दर्ज करें",
      },
      enterMobileNumber: {
        en: "Please enter your mobile number",
        hi: "कृपया अपना मोबाइल नंबर दर्ज करें",
      },
    },
    verifyOtp: {
      title: {
        en: "Verify OTP",
        hi: "OTP सत्यापित करें",
      },
      subtitle: {
        en: "Enter the 6-digit code sent to",
        hi: "भेजा गया 6 अंकों का कोड दर्ज करें",
      },
      otpExpiresIn: {
        en: "OTP expires in",
        hi: "OTP समाप्त होगा",
      },
      minutes: {
        en: "minutes",
        hi: "मिनट में",
      },
      enterOtpPlaceholder: {
        en: "Enter 6-digit OTP",
        hi: "6 अंकों का OTP दर्ज करें",
      },
      verifyOtp: {
        en: "Verify OTP",
        hi: "OTP सत्यापित करें",
      },
      verifying: {
        en: "Verifying...",
        hi: "सत्यापित हो रहा है...",
      },
      resendOtpIn: {
        en: "Resend OTP in",
        hi: "OTP फिर से भेजें",
      },
      resendOtp: {
        en: "Resend OTP",
        hi: "OTP फिर से भेजें",
      },
      changeNumber: {
        en: "Change Number",
        hi: "नंबर बदलें",
      },
      enterOtp: {
        en: "Please enter the OTP",
        hi: "कृपया OTP दर्ज करें",
      },
      otpMustBe6Digits: {
        en: "OTP must be 6 digits",
        hi: "OTP 6 अंकों का होना चाहिए",
      },
    },
  },

  // Profile Page
  profile: {
    title: {
      en: "Profile",
      hi: "प्रोफाइल",
    },
    loadingProfile: {
      en: "Loading profile...",
      hi: "प्रोफाइल लोड हो रहा है...",
    },
    failedToLoad: {
      en: "Failed to Load Profile",
      hi: "प्रोफाइल लोड करने में विफल",
    },
    noUserData: {
      en: "No user data available",
      hi: "कोई उपयोगकर्ता डेटा उपलब्ध नहीं",
    },
    verifiedAccount: {
      en: "Verified Account",
      hi: "सत्यापित खाता",
    },
    accountInformation: {
      en: "Account Information",
      hi: "खाता जानकारी",
    },
    mobileNumber: {
      en: "Mobile Number",
      hi: "मोबाइल नंबर",
    },
    memberSince: {
      en: "Member Since",
      hi: "सदस्य बने",
    },
    refreshProfile: {
      en: "Refresh Profile",
      hi: "प्रोफाइल रीफ्रेश करें",
    },
    refreshing: {
      en: "Refreshing...",
      hi: "रीफ्रेश हो रहा है...",
    },
    logout: {
      en: "Logout",
      hi: "लॉगआउट",
    },
    logoutConfirm: {
      en: "Logout",
      hi: "लॉगआउट",
    },
    logoutConfirmMessage: {
      en: "Are you sure you want to logout?",
      hi: "क्या आप वाकई लॉगआउट करना चाहते हैं?",
    },
    logoutButton: {
      en: "Logout",
      hi: "लॉगआउट",
    },
  },

  // My Reports Page
  myReports: {
    title: {
      en: "My Reports",
      hi: "मेरी रिपोर्ट्स",
    },
    loadingReports: {
      en: "Loading your reports...",
      hi: "आपकी रिपोर्ट लोड हो रही हैं...",
    },
    noReports: {
      en: "No Reports Yet",
      hi: "अभी तक कोई रिपोर्ट नहीं",
    },
    noReportsMessage: {
      en: "You haven't submitted any issue reports yet.",
      hi: "आपने अभी तक कोई समस्या रिपोर्ट सबमिट नहीं की है।",
    },
    reportedOn: {
      en: "Reported On",
      hi: "रिपोर्ट की तारीख",
    },
    lastUpdated: {
      en: "Last Updated",
      hi: "अंतिम अपडेट",
    },
  },

  // Report Detail Page
  reportDetail: {
    title: {
      en: "Report Details",
      hi: "रिपोर्ट विवरण",
    },
    loadingDetails: {
      en: "Loading report details...",
      hi: "रिपोर्ट विवरण लोड हो रहा है...",
    },
    reportNotFound: {
      en: "Report not found",
      hi: "रिपोर्ट नहीं मिली",
    },
    progressStatus: {
      en: "Progress Status",
      hi: "प्रगति स्थिति",
    },
    description: {
      en: "Description",
      hi: "विवरण",
    },
    attachedPhotos: {
      en: "Attached Photos",
      hi: "संलग्न फोटो",
    },
    reportInformation: {
      en: "Report Information",
      hi: "रिपोर्ट जानकारी",
    },
    reportedOn: {
      en: "Reported On",
      hi: "रिपोर्ट की तारीख",
    },
    lastUpdated: {
      en: "Last Updated",
      hi: "अंतिम अपडेट",
    },
  },

  // Issues Map Page
  issuesMap: {
    title: {
      en: "Issues Map",
      hi: "समस्याओं का मानचित्र",
    },
    initializingMap: {
      en: "Initializing map...",
      hi: "मानचित्र आरंभ हो रहा है...",
    },
    gettingLocation: {
      en: "Getting your location...",
      hi: "आपका स्थान प्राप्त हो रहा है...",
    },
    loadingIssues: {
      en: "Loading nearby issues...",
      hi: "पास की समस्याएं लोड हो रही हैं...",
    },
    locationRequired: {
      en: "Location Required",
      hi: "स्थान आवश्यक है",
    },
    locationRequiredMessage: {
      en: "Location permission denied. Please enable location access to view issues.",
      hi: "स्थान अनुमति अस्वीकृत। समस्याएं देखने के लिए कृपया स्थान पहुंच सक्षम करें।",
    },
    issuesCount: {
      en: "issues",
      hi: "समस्याएं",
    },
    issue: {
      en: "issue",
      hi: "समस्या",
    },
    issues: {
      en: "issues",
      hi: "समस्याएं",
    },
    of: {
      en: "of",
      hi: "में से",
    },
    filters: {
      en: "Filters",
      hi: "फ़िल्टर",
    },
    water: {
      en: "Water",
      hi: "जल",
    },
    electricity: {
      en: "Electricity",
      hi: "बिजली",
    },
    road: {
      en: "Road",
      hi: "सड़क",
    },
    garbage: {
      en: "Garbage",
      hi: "कचरा",
    },
    status: {
      en: "Status",
      hi: "स्थिति",
    },
  },

  // Ward Selection
  ward: {
    selectWard: {
      en: "Select Ward",
      hi: "वार्ड चुनें",
    },
    selectYourWard: {
      en: "Select your ward...",
      hi: "अपना वार्ड चुनें...",
    },
    searchPlaceholder: {
      en: "Search ward name or number...",
      hi: "वार्ड का नाम या नंबर खोजें...",
    },
    noWardsFound: {
      en: "No wards found",
      hi: "कोई वार्ड नहीं मिला",
    },
    parshad: {
      en: "Parshad",
      hi: "पार्षद",
    },
    viewMap: {
      en: "View Map",
      hi: "नक्शा देखें",
    },
    wardNumber: {
      en: "Ward",
      hi: "वार्ड",
    },
  },

  // Status Labels
  status: {
    reported: {
      en: "Reported",
      hi: "रिपोर्ट की गई",
    },
    assigned: {
      en: "Assigned",
      hi: "सौंपा गया",
    },
    parshadCheck: {
      en: "Parshad Check",
      hi: "पार्षद जांच",
    },
    startedWorking: {
      en: "Started Working",
      hi: "काम शुरू हुआ",
    },
    finishedWork: {
      en: "Finished Work",
      hi: "काम पूरा हुआ",
    },
    parshad: {
      en: "Parshad",
      hi: "पार्षद",
    },
    pwdClerkStartedWorking: {
      en: "PWD/Clerk\nStarted Working",
      hi: "PWD/क्लर्क\nकाम शुरू",
    },
    finishedWorking: {
      en: "Finished\nWorking",
      hi: "काम\nपूरा हुआ",
    },
  },

  // Parshad Dashboard
  parshad: {
    dashboard: {
      title: {
        en: "Parshad Dashboard",
        hi: "पार्षद डैशबोर्ड",
      },
      welcome: {
        en: "Welcome, Parshad",
        hi: "स्वागत है, पार्षद",
      },
      totalAssigned: {
        en: "Total Assigned",
        hi: "कुल सौंपे गए",
      },
      pendingAcknowledgement: {
        en: "Pending",
        hi: "लंबित",
      },
      inProgress: {
        en: "In Progress",
        hi: "प्रगति में",
      },
      completed: {
        en: "Completed",
        hi: "पूर्ण",
      },
      issuesByType: {
        en: "Issues by Type",
        hi: "प्रकार के अनुसार समस्याएं",
      },
      noIssuesAssigned: {
        en: "No Issues Assigned",
        hi: "कोई समस्या नहीं सौंपी गई",
      },
      noIssuesAssignedMessage: {
        en: "You have no issues assigned to you at the moment.",
        hi: "इस समय आपको कोई समस्या नहीं सौंपी गई है।",
      },
    },
    issues: {
      title: {
        en: "Assigned Issues",
        hi: "सौंपी गई समस्याएं",
      },
      pending: {
        en: "Pending",
        hi: "लंबित",
      },
      inProgress: {
        en: "In Progress",
        hi: "प्रगति में",
      },
      completed: {
        en: "Completed",
        hi: "पूर्ण",
      },
      all: {
        en: "All",
        hi: "सभी",
      },
      viewDetails: {
        en: "View Details",
        hi: "विवरण देखें",
      },
      acknowledge: {
        en: "Acknowledge",
        hi: "स्वीकार करें",
      },
      startWork: {
        en: "Start Work",
        hi: "काम शुरू करें",
      },
      markComplete: {
        en: "Mark Complete",
        hi: "पूर्ण करें",
      },
      updateProgress: {
        en: "Update Progress",
        hi: "प्रगति अपडेट करें",
      },
      acknowledging: {
        en: "Acknowledging...",
        hi: "स्वीकार कर रहे हैं...",
      },
      startingWork: {
        en: "Starting work...",
        hi: "काम शुरू कर रहे हैं...",
      },
      completing: {
        en: "Completing...",
        hi: "पूर्ण कर रहे हैं...",
      },
      updating: {
        en: "Updating...",
        hi: "अपडेट कर रहे हैं...",
      },
    },
    issueDetail: {
      title: {
        en: "Issue Details",
        hi: "समस्या विवरण",
      },
      reportedBy: {
        en: "Reported By",
        hi: "रिपोर्टर",
      },
      assignmentNotes: {
        en: "Assignment Notes",
        hi: "असाइनमेंट नोट्स",
      },
      progressNotes: {
        en: "Progress Notes",
        hi: "प्रगति नोट्स",
      },
      addProgressNote: {
        en: "Add Progress Note",
        hi: "प्रगति नोट जोड़ें",
      },
      progressNotePlaceholder: {
        en: "Describe the work done or progress made...",
        hi: "किए गए कार्य या प्रगति का वर्णन करें...",
      },
      attachPhotos: {
        en: "Attach Photos",
        hi: "फोटो जोड़ें",
      },
      attachPhotosDesc: {
        en: "Add photos as proof of work (up to 5)",
        hi: "काम के प्रमाण के रूप में फोटो जोड़ें (5 तक)",
      },
      submitUpdate: {
        en: "Submit Update",
        hi: "अपडेट सबमिट करें",
      },
      submitting: {
        en: "Submitting...",
        hi: "सबमिट हो रहा है...",
      },
      selectNewStatus: {
        en: "Select New Status",
        hi: "नई स्थिति चुनें",
      },
    },
    status: {
      acknowledgeConfirm: {
        en: "Are you sure you want to acknowledge this issue?",
        hi: "क्या आप वाकई इस समस्या को स्वीकार करना चाहते हैं?",
      },
      startWorkConfirm: {
        en: "Are you sure you want to start working on this issue?",
        hi: "क्या आप वाकई इस समस्या पर काम शुरू करना चाहते हैं?",
      },
      completeConfirm: {
        en: "Are you sure you want to mark this issue as complete?",
        hi: "क्या आप वाकई इस समस्या को पूर्ण के रूप में चिह्नित करना चाहते हैं?",
      },
      statusUpdated: {
        en: "Status updated successfully",
        hi: "स्थिति सफलतापूर्वक अपडेट की गई",
      },
    },
  },
};
