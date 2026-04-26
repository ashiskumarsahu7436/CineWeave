import { MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LocationOption {
  code: string;
  name: string;
}

const countries: LocationOption[] = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
];

export default function Location() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const c = (user as any)?.country;
    if (c) setSelectedCountry(c);
  }, [user]);

  const filtered = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = (user as any)?.id;
      if (!userId) throw new Error('Not authenticated');
      await apiRequest('PATCH', `/api/users/${userId}`, { country: selectedCountry });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Location saved' });
    },
    onError: () => toast({ title: 'Could not save location', variant: 'destructive' }),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Location</h1>
        <p className="text-muted-foreground">Select your country to get personalized content</p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-country"
        />

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filtered.map((country) => (
            <div
              key={country.code}
              className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedCountry === country.code ? "bg-muted border-primary" : ""
              }`}
              onClick={() => setSelectedCountry(country.code)}
              data-testid={`option-country-${country.code}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{country.name}</span>
                </div>
                {selectedCountry === country.code && <Check className="h-5 w-5 text-primary" />}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No countries found</p>
          </div>
        )}

        <div className="pt-6 border-t mt-6">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!user || saveMutation.isPending}
            data-testid="button-save-location"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
