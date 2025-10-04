import { 
  User, 
  LogOut, 
  UserPlus, 
  Crown, 
  Video, 
  CreditCard, 
  Palette, 
  Globe, 
  MapPin, 
  Keyboard,
  ChevronRight,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";

interface AccountMenuProps {
  onClose?: () => void;
}

export default function AccountMenu({ onClose }: AccountMenuProps) {
  const { currentUserId } = useAppStore();

  const menuSections = [
    {
      items: [
        { icon: User, label: "Your channel", action: () => console.log("Your channel") },
        { icon: UserPlus, label: "Switch account", action: () => console.log("Switch account") },
        { icon: LogOut, label: "Sign out", action: () => console.log("Sign out") }
      ]
    },
    {
      items: [
        { icon: Crown, label: "CineWeave Premium", action: () => console.log("Premium") },
        { icon: Video, label: "CineWeave Studio", action: () => console.log("Studio") },
        { icon: CreditCard, label: "Purchases and memberships", action: () => console.log("Purchases") }
      ]
    },
    {
      items: [
        { icon: Palette, label: "Appearance", value: "Device theme", hasArrow: true },
        { icon: Globe, label: "Language", value: "English", hasArrow: true },
        { icon: MapPin, label: "Location", value: "India", hasArrow: true },
        { icon: Keyboard, label: "Keyboard shortcuts", hasArrow: true }
      ]
    },
    {
      items: [
        { icon: Settings, label: "Settings", link: "/settings" }
      ]
    }
  ];

  return (
    <div className="w-80 bg-background border-l border-border h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">Brilliant GUIDE</div>
            <div className="text-sm text-muted-foreground truncate">@brilliantguide</div>
            <Link href="/channel/user" className="text-sm text-primary hover:underline">
              View your channel
            </Link>
          </div>
        </div>

        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <Separator className="my-2" />
            <div className="py-2">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                
                if ('link' in item && item.link) {
                  return (
                    <Link
                      key={itemIndex}
                      href={item.link}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <div
                    key={itemIndex}
                    onClick={'action' in item ? item.action : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      {'value' in item && item.value && (
                        <div className="text-xs text-muted-foreground">{item.value}</div>
                      )}
                    </div>
                    {'hasArrow' in item && item.hasArrow && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
