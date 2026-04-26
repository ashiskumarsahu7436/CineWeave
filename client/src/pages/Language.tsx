import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

export default function Language() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const lang = (user as any)?.language;
    if (lang) setSelectedLanguage(lang);
  }, [user]);

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = (user as any)?.id;
      if (!userId) throw new Error('Not authenticated');
      await apiRequest('PATCH', `/api/users/${userId}`, { language: selectedLanguage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Language preference saved' });
    },
    onError: () => toast({ title: 'Could not save language', variant: 'destructive' }),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Language</h1>
        <p className="text-muted-foreground">Select your preferred language</p>
      </div>

      <div className="space-y-6">
        <Input
          type="text"
          placeholder="Search languages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
          data-testid="input-search-language"
        />

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filtered.map((language) => (
            <div
              key={language.code}
              className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedLanguage === language.code ? "bg-muted border-primary" : ""
              }`}
              onClick={() => setSelectedLanguage(language.code)}
              data-testid={`option-language-${language.code}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{language.name}</div>
                    <div className="text-sm text-muted-foreground">{language.nativeName}</div>
                  </div>
                </div>
                {selectedLanguage === language.code && <Check className="h-5 w-5 text-primary" />}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No languages found</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!user || saveMutation.isPending}
            data-testid="button-save-language"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
