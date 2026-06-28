import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, MessageCircle, Globe } from "lucide-react";
import logoImage from "@assets/gauranitai_logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultFooterLinks = [
  {
    title: "Products",
    links: [
      { label: "Milk", url: "/shop" },
      { label: "Curd", url: "/shop" },
      { label: "Ghee", url: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", url: "/about" },
      { label: "Contact", url: "/contact" },
      { label: "Privacy", url: "/privacy" },
    ],
  },
];

const defaultSettings = {
  companyName: "Gauranitai Dairy Pvt Ltd",
  tagline: "Pure. Fresh. Daily.",
  description: "Dedicated to bringing the authentic taste and nutrition of the farm to the modern table through sustainable and ethical practices.",
  phone: "+91 91234 56789",
  email: "hello@gauranitai.com",
  address: "Sector 44, Gurgaon, Haryana 122003",
  copyrightText: "© 2025 Gauranitai. All rights reserved.",
  socialLinks: [
    { platform: "facebook", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "whatsapp", url: "#" }
  ],
  footerLinks: defaultFooterLinks
};

const iconMapping: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  whatsapp: MessageCircle,
  website: Globe,
};

const platformColors: Record<string, string> = {
  facebook: "hover:bg-blue-600",
  instagram: "hover:bg-pink-600",
  twitter: "hover:bg-blue-400",
  whatsapp: "hover:bg-green-600",
  default: "hover:bg-green-600",
};

export default function SiteFooter() {
  const { settings: siteSettings } = useSiteSettings();
  const { data: settings = defaultSettings } = useQuery({
    queryKey: ["/api/homepage/footer/public"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/footer/public");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data && Object.keys(data).length > 0 ? data : defaultSettings;
    },
  });

  // Parse JSON fields safely
  const parseJSON = (val: any, fallback: any) => {
    if (!val) return fallback;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch(e) { return fallback; }
    }
    return val;
  };

  const socialLinks = parseJSON(settings.socialLinks, defaultSettings.socialLinks);
  const footerSections = parseJSON(settings.footerLinks, defaultSettings.footerLinks);

  const brandName = siteSettings.brandName || settings.companyName;
  const logoUrl = siteSettings.logoUrl || logoImage;

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center overflow-hidden p-1.5 ring-2 ring-gray-800 group-hover:ring-green-500 transition-all duration-300">
                <img 
                  src={logoUrl} 
                  alt={brandName} 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-semibold text-white tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>{brandName}</span>
                <p className="text-xs text-orange-500 font-medium tracking-wider uppercase -mt-0.5">{settings.tagline}</p>
              </div>
            </Link>
            
            <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
              {settings.description}
            </p>

            <div className="space-y-4">
              <a href={`tel:${settings.phone}`} className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{settings.phone}</span>
              </a>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{settings.email}</span>
              </a>
              <div className="flex items-start gap-3 text-gray-400 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm leading-relaxed">{settings.address}</span>
              </div>
            </div>
          </div>

          {Array.isArray(footerSections) && footerSections.map((section: any, idx: number) => (
            <div key={idx}>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest border-b border-gray-800 pb-2 inline-block">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {Array.isArray(section.links) && section.links.map((link: any, index: number) => (
                  <li key={index}>
                    <Link
                      href={link.url || link.href || "#"}
                      className="text-gray-400 text-sm hover:text-green-400 hover:translate-x-1 transition-all duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 py-8 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {Array.isArray(socialLinks) && socialLinks.map((social: any, idx: number) => {
                const Icon = iconMapping[social.platform.toLowerCase()] || Globe;
                const colorClass = platformColors[social.platform.toLowerCase()] || platformColors.default;
                
                return (
                  <a 
                    key={idx}
                    href={social.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 ${colorClass} hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/20`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
