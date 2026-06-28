import { useState, useEffect } from "react";
import MainPageLayout from "@/components/layout/main-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  ArrowRight,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

export default function ContactPage() {
  const [contact, setContact] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch("/api/cms/contact/public");
        const data = await response.json();
        setContact(data);
      } catch (error) {
        console.error("Error fetching contact data:", error);
      }
    };
    fetchContact();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({ description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast({ 
          title: "Message Sent! 🌿",
          description: "Thank you for reaching out. Our team will get back to you within 24 hours." 
        });
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        toast({ description: "Error sending message. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Error sending message. Please try again.", variant: "destructive" });
    }
    setSending(false);
  };

  if (!contact)
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

  return (
    <MainPageLayout>
      <div className="bg-white min-h-screen">
        
        {/* Section 1: Hero Section */}
        <section className="relative h-[400px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={contact.heroImageUrl || "/images/banners/premium_dairy_products_showcase.png"} 
              alt="Contact Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-green-900/60 backdrop-blur-[1px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight">
                {contact.heroTitle || "Contact Us"}
              </h1>
              <p className="text-lg md:text-xl text-green-50 max-w-2xl mx-auto font-medium drop-shadow-md">
                {contact.heroSubtitle || "We're here to help. Reach out to us for any queries or support."}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-24 -mt-16 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Section 2: Contact Info */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[2rem] p-6 md:p-8 lg:p-12 shadow-2xl border border-green-50"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-10">Get in Touch</h2>
                  
                  <div className="space-y-8">
                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Call Us</p>
                        <a href={`tel:${contact.phone}`} className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors block truncate">
                          {contact.phone || "+91 91234 56789"}
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Us</p>
                        <a href={`mailto:${contact.email}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors block truncate">
                          {contact.email || "hello@gauranitai.com"}
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Our Location</p>
                        <p className="text-base font-semibold text-gray-700 leading-relaxed">
                          {contact.address || "Gauranitai Hub, Sector 44, Gurgaon, Haryana 122003"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Working Hours</p>
                        <p className="text-base font-semibold text-gray-700 whitespace-pre-line leading-relaxed">
                          {contact.businessHours || "Delivery: 4:00 AM - 7:30 AM\nSupport: 9:00 AM - 9:00 PM"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-10 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">Follow Us</p>
                    <div className="flex justify-center gap-6">
                      <a href={contact.socialLinks?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-all"><Facebook className="w-5 h-5" /></a>
                      <a href={contact.socialLinks?.instagram || "#"} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-all"><Instagram className="w-5 h-5" /></a>
                      <a href={contact.socialLinks?.twitter || "#"} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-all"><Twitter className="w-5 h-5" /></a>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Section 3: Contact Form */}
              <div className="lg:col-span-7 xl:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl border border-green-50 h-full"
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-1 bg-green-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Send us a Message</h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <Input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Full Name"
                          className="h-14 px-5 rounded-xl bg-gray-50 border-gray-100 focus-visible:ring-2 focus-visible:ring-green-500 text-base font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Email Address"
                          className="h-14 px-5 rounded-xl bg-gray-50 border-gray-100 focus-visible:ring-2 focus-visible:ring-green-500 text-base font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ex: +91 99999 88888"
                        className="h-14 px-5 rounded-xl bg-gray-50 border-gray-100 focus-visible:ring-2 focus-visible:ring-green-500 text-base font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">How can we help?</label>
                      <Textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Write your message here..."
                        className="min-h-[160px] p-5 rounded-2xl bg-gray-50 border-gray-100 focus-visible:ring-2 focus-visible:ring-green-500 text-base font-semibold"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                    >
                      {sending ? "Processing..." : (
                        <>
                          Send Message <Send className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              </div>

            </div>

            {/* Section 4: Map Section */}
            {contact.mapEmbedUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mt-24 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-white h-[450px]"
              >
                <div 
                  className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                  dangerouslySetInnerHTML={{ __html: contact.mapEmbedUrl }}
                />
              </motion.div>
            )}
          </div>
        </section>

        {/* Floating Chat CTA */}
        <div className="fixed bottom-10 right-10 z-50">
          <Button 
            className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
          >
            <MessageSquare className="w-10 h-10 group-hover:animate-bounce" />
          </Button>
        </div>

      </div>
    </MainPageLayout>
  );
}
