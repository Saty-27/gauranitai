import { useState, useEffect } from "react";
import MainPageLayout from "@/components/layout/main-page-layout";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Leaf, 
  ShieldCheck, 
  Users, 
  Truck, 
  Heart, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

// Helper to map icon names to Lucide components
const IconMap: Record<string, any> = {
  Leaf,
  ShieldCheck,
  Users,
  Truck,
  Heart,
  Sparkles,
  CheckCircle2
};

export default function AboutPage() {
  const [about, setAbout] = useState<any>(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const response = await fetch("/api/cms/about-us/public");
        const data = await response.json();
        setAbout(data);
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    };
    fetchAbout();
  }, []);

  if (!about)
    return (
      <MainPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      </MainPageLayout>
    );

  const values = Array.isArray(about.values) ? about.values : [];
  const processSteps = Array.isArray(about.processSteps) ? about.processSteps : [];

  return (
    <MainPageLayout>
      <div className="bg-white overflow-hidden">
        
        {/* Section 1: Hero Section */}
        <section className="relative h-[500px] lg:h-[600px] flex items-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={about.heroImageUrl || "/images/banners/premium_dairy_products_showcase.png"} 
              alt="Hero Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-lg">
                {about.heroTitle || "Our Story"}
              </h1>
              <p className="text-xl md:text-2xl text-green-50 max-w-2xl font-medium mb-10 drop-shadow-md">
                {about.heroSubtitle || "Bringing the purest gifts of nature straight to your doorstep, daily."}
              </p>
              {about.heroCtaText && (
                <Button 
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white px-10 py-7 rounded-full text-lg font-bold shadow-xl transition-all hover:scale-105"
                >
                  <a href={about.heroCtaLink || "/shop"}>
                    {about.heroCtaText} <ArrowRight className="ml-2" />
                  </a>
                </Button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Section 2: Company Story */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold tracking-wider uppercase mb-6">
                  <Sparkles className="w-4 h-4" /> Since 2025
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
                  {about.storyHeading || `The Legacy of ${settings.brandName}`}
                </h2>
                <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {about.storyDescription || "Our journey began with a simple belief: that everyone deserves access to fresh, unprocessed, and pure dairy. We've spent years building a network of trusted farms that share our commitment to animal welfare and quality excellence."}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={about.storyImageUrl || "/images/banners/fresh_milk_pour_splash_banner.png"} 
                    alt="Our Journey" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-green-100 rounded-full -z-10 blur-2xl opacity-60"></div>
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-100 rounded-full -z-10 blur-2xl opacity-60"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 3: Our Values */}
        <section className="py-24 bg-green-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                {about.valuesTitle || "Our Core Values"}
              </h2>
              <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.length > 0 ? (
                values.map((value: any, idx: number) => {
                  const Icon = IconMap[value.icon] || Heart;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white p-10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all border border-green-100 group text-left"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white transition-colors duration-500">
                        <Icon className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-green-700 transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        {value.description}
                      </p>
                    </motion.div>
                  );
                })
              ) : (
                // Fallback static values if none in DB
                [
                  { title: "Purity First", desc: "No chemicals, no preservatives. Just 100% pure dairy.", icon: Leaf },
                  { title: "Farm to Table", desc: "Sourced directly from our managed farms to ensure freshness.", icon: ShieldCheck },
                  { title: "Transparency", desc: "Complete traceability for every batch of milk we deliver.", icon: Sparkles },
                ].map((v, i) => (
                  <div key={i} className="bg-white p-10 rounded-[2rem] shadow-xl text-left border border-green-100">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-8">
                      <v.icon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4">{v.title}</h3>
                    <p className="text-gray-600 leading-relaxed font-medium">{v.desc}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Process / How It Works */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                {about.processTitle || "How We Do It"}
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                A seamless process from the farm to your doorstep, ensuring maximum nutrients.
              </p>
            </div>

            <div className="relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden lg:block absolute top-24 left-0 w-full h-1 bg-green-100 -z-0"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                {(processSteps.length > 0 ? processSteps : [
                  { title: "Farm Collection", desc: "Milk collected early morning from local farms.", icon: "Leaf" },
                  { title: "Quality Check", desc: "Rigorous testing for over 24 parameters.", icon: "ShieldCheck" },
                  { title: "Chilling", desc: "Immediate chilling to maintain peak freshness.", icon: "Sparkles" },
                  { title: "Delivery", desc: "Reached your doorstep within 3-4 hours.", icon: "Truck" },
                ]).map((step: any, idx: number) => {
                  const Icon = IconMap[step.icon] || CheckCircle2;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border-4 border-white">
                        <Icon className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-4">{step.title}</h3>
                      <p className="text-gray-600 font-medium px-4">{step.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-green-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-green-200"
            >
              {/* Decorative background shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                  {about.ctaHeading || "Ready to Taste the Difference?"}
                </h2>
                <p className="text-xl md:text-2xl text-green-50 mb-12 font-medium">
                  {about.ctaSubheading || "Join our family of 10,000+ happy customers today."}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button 
                    asChild
                    size="lg"
                    className="bg-white text-green-700 hover:bg-green-50 px-12 py-8 rounded-2xl text-xl font-black shadow-lg transition-all hover:-translate-y-1"
                  >
                    <a href={about.ctaButtonLink || "/subscription"}>
                      {about.ctaButtonText || "Start Subscription"}
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </MainPageLayout>
  );
}
