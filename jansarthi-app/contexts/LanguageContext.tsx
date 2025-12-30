import { Language, translations, Translations } from "@/config/translations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

const LANGUAGE_STORAGE_KEY = "@jansarthi_language";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  getText: (translation: { en: string; hi: string }) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === "en" || savedLanguage === "hi") {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Save language preference when it changes
  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Error saving language preference:", error);
      // Still update the state even if storage fails
      setLanguageState(lang);
    }
  };

  const getText = (translation: { en: string; hi: string }): string => {
    return translation[language];
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations,
    getText,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
