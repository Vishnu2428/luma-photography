/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Camera, Image as ImageIcon, Mail, MapPin, Phone, Instagram, MessageCircle, ChevronRight, Play, CheckCircle2, AlertCircle, Loader2, LogOut, Trash2, Calendar, User, MessageSquare, Sun, Moon } from "lucide-react";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { db, auth, OperationType, handleFirestoreError } from "./firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Import images from assets
import lumaBranding from "./assets/luma-branding.jpeg";
import warmEmbrace from "./assets/warm-embrace.jpeg";
import traditionalGrace from "./assets/traditional-grace.jpeg";
import warmLove from "./assets/warm-love.jpeg";
import timelessMoments from "./assets/timeless-moments.jpeg";
import templeVows from "./assets/temple-vows.jpeg";

// Types
interface Inquiry {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  createdAt: Timestamp;
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): any {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center p-8">
          <div className="max-w-md w-full glass p-8 rounded-3xl border border-red-500/20 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif mb-4 text-[var(--fg)]">Something went wrong</h2>
            <p className="text-[var(--accent)] text-sm mb-6">
              {this.state.error?.message.startsWith('{') 
                ? "A database error occurred. Please try again later."
                : this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[var(--accent-muted)] transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Navbar = ({ isDarkMode, onToggleTheme }: { isDarkMode: boolean; onToggleTheme: () => void }) => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 glass"
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.history.pushState({}, '', '/')}>
        <Camera className="w-6 h-6 text-[var(--fg)]" />
        <span className="text-xl font-serif tracking-widest uppercase text-[var(--fg)]">Luma</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium text-[var(--accent)]">
        <a href="#work" className="hover:text-[var(--fg)] transition-colors">Work</a>
        <a href="#services" className="hover:text-[var(--fg)] transition-colors">Services</a>
        <a href="#about" className="hover:text-[var(--fg)] transition-colors">About</a>
        <a href="#contact" className="hover:text-[var(--fg)] transition-colors">Contact</a>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleTheme}
          className="p-2 rounded-full hover:bg-[var(--fg)]/10 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
        </button>
        <button 
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-6 py-2 border border-[var(--fg)]/20 rounded-full text-xs uppercase tracking-widest hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all duration-300"
        >
          Book Session
        </button>
      </div>
    </motion.nav>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <motion.div 
        style={{ y: y1 }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=2000" 
          alt="Cinematic Landscape" 
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg)]/50 to-[var(--bg)]" />
      </motion.div>

      <div className="relative z-10 text-center px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-serif italic mb-8 text-gradient">
            Luma Photography
          </h1>
          <p className="text-lg md:text-xl text-[var(--accent)] tracking-[0.2em] uppercase font-light max-w-2xl mx-auto leading-relaxed">
            Every frame begins with light,<br />
            <span className="text-[var(--fg)] font-medium">Every memory begins with Luma</span>
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="w-px h-24 bg-gradient-to-b from-[var(--accent)]/50 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--accent-muted)]">Scroll to explore</span>
        </motion.div>
      </div>
    </section>
  );
};

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  
  const images = [
    { url: lumaBranding, title: "Luma Branding", category: "Studio" },
    { url: warmEmbrace, title: "Warm Embrace", category: "Portrait" },
    { url: traditionalGrace, title: "Traditional Grace", category: "Wedding" },
    { url: warmLove, title: "warm love", category: "Wedding" },
    { url: timelessMoments, title: "Timeless Moments", category: "Portrait" },
    { url: templeVows, title: "Temple Vows", category: "Wedding" },
  ];

  const filteredImages = activeCategory === "All" 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <section id="work" className="py-32 px-8 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-4xl font-serif mb-4 text-[var(--fg)]">Selected Works</h2>
            <p className="text-[var(--accent)] max-w-md">Capturing the essence of moments through a cinematic lens. Our portfolio spans across diverse genres of visual storytelling.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {['All', 'Studio', 'Portrait', 'Wedding'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] uppercase tracking-widest px-6 py-2 rounded-full transition-all duration-300 border ${
                  activeCategory === cat 
                    ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" 
                    : "bg-transparent text-[var(--fg)] border-[var(--fg)]/20 hover:border-[var(--accent)]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img) => (
              <motion.div 
                layout
                key={img.url}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl cursor-pointer bg-[var(--fg)]/5"
              >
              <img 
                src={img.url} 
                alt={img.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="eager"
                referrerPolicy="no-referrer"
                onError={(e) => console.error(`Failed to load image: ${img.url}`, e)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 z-20">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">{img.category}</span>
                <h3 className="text-xl font-serif text-[var(--fg)]">{img.title}</h3>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

const Services = () => {
  const services = [
    { icon: Camera, title: "Commercial", desc: "High-end product and brand photography that tells your story." },
    { icon: ImageIcon, title: "Editorial", desc: "Creative visual content for magazines, books, and digital media." },
    { icon: Play, title: "Cinematography", desc: "Moving frames that capture the rhythm of life in 4K." },
  ];

  return (
    <section id="services" className="py-32 px-8 glass border-y border-[var(--fg)]/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
        {services.map((s, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="w-12 h-12 rounded-full border border-[var(--accent)]/20 flex items-center justify-center">
              <s.icon className="w-5 h-5 text-[var(--fg)]" />
            </div>
            <h3 className="text-2xl font-serif text-[var(--fg)]">{s.title}</h3>
            <p className="text-[var(--accent)] leading-relaxed text-sm">{s.desc}</p>
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--fg)] group"
            >
              Learn More <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Contact = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Commercial',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const submissionsRef = collection(db, 'submissions');
      await addDoc(submissionsRef, {
        ...formData,
        createdAt: new Date().toISOString()
      });

      // Sync to Google Sheets automatically (optional fallback)
      try {
        await fetch('/api/sync-to-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (sheetError) {
        console.error("Failed to sync to Google Sheets, but Firestore saved:", sheetError);
      }

      // Send Email Notification
      try {
        const emailRes = await fetch('/api/send-email-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (!emailRes.ok) {
          const errorData = await emailRes.json();
          console.error("Email notification failed server-side:", errorData.error);
          // We don't alert the user here to avoid confusing the client, 
          // but it will be in the browser console for us to debug.
        } else {
          console.log("Email notification sent successfully");
        }
      } catch (emailError) {
        console.error("Failed to send email notification (network error):", emailError);
      }

      setStatus('success');
      setFormData({ name: '', email: '', service: 'Commercial', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    }
  };

  return (
    <section id="contact" className="py-32 px-8 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div>
          <h2 className="text-5xl font-serif mb-8 text-gradient">Let's Create<br />Something Timeless</h2>
          <p className="text-[var(--accent-muted)] mb-12 max-w-md">Ready to capture your next memory? Get in touch for bookings, collaborations, or just to say hello.</p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-[var(--accent)]">
              <Mail className="w-5 h-5" />
              <span>lumaphotographstudio@gmail.com</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-[var(--accent)]">
                <Phone className="w-5 h-5" />
                <span>+91 9361914997</span>
              </div>
              <div className="flex items-center gap-4 text-[var(--accent)]">
                <Phone className="w-5 h-5" />
                <span>+91 7598980883</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[var(--accent)]">
              <MapPin className="w-5 h-5" />
              <span>Salem, TamilNadu</span>
            </div>
          </div>

          <div className="flex gap-6 mt-12">
            <a 
              href="https://www.instagram.com/_lumaphotography_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-[var(--fg)]/10 flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://wa.me/919361914997" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-[var(--fg)]/10 flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass p-12 rounded-3xl border border-[var(--glass-border)] flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
                <h3 className="text-2xl font-serif mb-4 text-[var(--fg)]">Inquiry Received</h3>
                <p className="text-[var(--accent)] text-sm">Thank you for reaching out. We'll get back to you shortly to discuss your vision.</p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-8 glass p-12 rounded-3xl border border-[var(--glass-border)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)]">Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-transparent border-b border-[var(--accent)]/20 py-2 focus:border-[var(--accent)] outline-none transition-colors text-[var(--fg)]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)]">Email</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-transparent border-b border-[var(--accent)]/20 py-2 focus:border-[var(--accent)] outline-none transition-colors text-[var(--fg)]" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)]">Service</label>
                  <select 
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    className="w-full bg-transparent border-b border-[var(--accent)]/20 py-2 focus:border-[var(--accent)] outline-none transition-colors appearance-none text-[var(--fg)]"
                  >
                    <option className="bg-[var(--bg)] text-[var(--fg)]">Commercial</option>
                    <option className="bg-[var(--bg)] text-[var(--fg)]">Portrait</option>
                    <option className="bg-[var(--bg)] text-[var(--fg)]">Editorial</option>
                    <option className="bg-[var(--bg)] text-[var(--fg)]">Cinematography</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)]">Message</label>
                  <textarea 
                    required
                    rows={4} 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-transparent border-b border-[var(--accent)]/20 py-2 focus:border-[var(--accent)] outline-none transition-colors resize-none text-[var(--fg)]" 
                  />
                </div>
                <button 
                  disabled={status === 'submitting'}
                  className="w-full py-4 bg-[var(--accent)] text-[var(--bg)] text-xs uppercase tracking-[0.3em] font-bold rounded-full hover:bg-[var(--accent-muted)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Send Inquiry'}
                </button>
                {status === 'error' && (
                  <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">Failed to send. Please try again.</p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-32 px-8 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative aspect-[4/5] rounded-3xl overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1000" 
            alt="Photographer at work" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/60 to-transparent" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--accent-muted)] mb-6 block">The Visionary</span>
          <h2 className="text-5xl font-serif mb-8 leading-tight text-[var(--fg)]">Crafting stories through the lens of time.</h2>
          <p className="text-[var(--accent)] text-lg leading-relaxed mb-8">
            At Luma, we believe that photography is more than just capturing an image; it's about preserving a feeling. Our approach combines cinematic aesthetics with raw, authentic emotion to create visuals that resonate.
          </p>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h4 className="text-3xl font-serif mb-2 text-[var(--fg)]">3+</h4>
              <p className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)]">Years Experience</p>
            </div>
            <div>
              <h4 className="text-3xl font-serif mb-2 text-[var(--fg)]">20+</h4>
              <p className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)]">Projects Completed</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const AdminDashboard = ({ user, onLogout }: { user: FirebaseUser; onLogout: () => void }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "submissions");
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "submissions", id));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `submissions/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-serif mb-2">Admin Dashboard</h1>
            <p className="text-[var(--accent-muted)] text-sm">Welcome back, {user.displayName}</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 border border-[var(--glass-border)] rounded-full transition-colors text-xs uppercase tracking-widest text-[var(--fg)]"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-muted)]" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 bg-[var(--fg)]/5 rounded-3xl border border-dashed border-[var(--glass-border)]">
            <MessageSquare className="w-12 h-12 text-[var(--accent-muted)] mx-auto mb-4" />
            <p className="text-[var(--accent-muted)]">No submissions found yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {submissions.map((sub) => (
              <motion.div 
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--fg)]/5 border border-[var(--glass-border)] rounded-3xl p-6 md:p-8 hover:bg-[var(--fg)]/[0.07] transition-colors group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[var(--fg)]/10 rounded-full text-[10px] uppercase tracking-widest font-medium text-[var(--fg)]">
                        {sub.service}
                      </span>
                      <span className="text-[var(--accent-muted)] text-[10px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium mb-1 flex items-center gap-2 text-[var(--fg)]">
                      <User className="w-5 h-5 text-[var(--accent-muted)]" /> {sub.name}
                    </h3>
                    <p className="text-[var(--accent)] text-sm mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--accent-muted)]" /> {sub.email}
                    </p>
                    <div className="bg-[var(--bg)]/40 rounded-2xl p-4 text-[var(--accent)] text-sm leading-relaxed italic border border-[var(--glass-border)]">
                      "{sub.message}"
                    </div>
                  </div>
                  <div className="flex md:flex-col justify-end gap-2">
                    {deleteId === sub.id ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleDelete(sub.id)}
                          className="px-4 py-2 bg-red-500 text-white text-[10px] uppercase tracking-widest rounded-xl font-bold"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setDeleteId(null)}
                          className="px-4 py-2 bg-white/10 text-white text-[10px] uppercase tracking-widest rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteId(sub.id)}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-colors"
                        title="Delete Submission"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 px-8 border-t border-[var(--fg)]/5 text-center bg-[var(--bg)]">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Camera className="w-4 h-4 text-[var(--accent-muted)]" />
        <span className="text-sm font-serif tracking-widest uppercase text-[var(--accent-muted)]">Luma</span>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[var(--accent-muted)] mb-4 opacity-60">
        © 2026 Luma Photography. All rights reserved.
      </p>
      <button 
        onClick={() => {
          window.history.pushState({}, '', '/adminlogin');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        className="text-[8px] uppercase tracking-[0.3em] text-[var(--accent-muted)] hover:text-[var(--fg)] transition-colors"
      >
        Admin Login
      </button>
    </footer>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL || !user?.emailVerified) {
        setIsAdminView(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentPath === '/adminlogin') {
      if (user?.email === import.meta.env.VITE_ADMIN_EMAIL && user?.emailVerified) {
        setIsAdminView(true);
      }
    } else {
      setIsAdminView(false);
    }
  }, [currentPath, user]);

  const handleAdminLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email === import.meta.env.VITE_ADMIN_EMAIL && result.user.emailVerified) {
        setIsAdminView(true);
      } else if (result.user.email === import.meta.env.VITE_ADMIN_EMAIL && !result.user.emailVerified) {
        setLoginError("Access Denied: Please verify your email address.");
        await signOut(auth);
      } else {
        setLoginError("Access Denied: You are not authorized to view client messages.");
        await signOut(auth);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // Silently handle user cancellation
        return;
      }
      console.error("Login failed", error);
      setLoginError(error.message || "Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminView(false);
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  if (currentPath === '/adminlogin' && (!user || user.email !== import.meta.env.VITE_ADMIN_EMAIL || !user.emailVerified)) {
    return (
      <ErrorBoundary>
        <div className={`min-h-screen flex items-center justify-center p-8 bg-[var(--bg)] ${isDarkMode ? "" : "light"}`}>
          <div className="max-w-md w-full glass p-12 rounded-3xl border border-[var(--glass-border)] text-center">
            <Camera className="w-12 h-12 text-[var(--fg)] mx-auto mb-6" />
            <h2 className="text-3xl font-serif mb-4 text-[var(--fg)]">Admin Portal</h2>
            <p className="text-[var(--accent)] text-sm mb-8">Please sign in with your authorized account to access the dashboard.</p>
            
            {loginError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">{loginError}</span>
              </div>
            )}

            <button 
              onClick={handleAdminLogin}
              className="w-full py-4 bg-[var(--fg)] text-[var(--bg)] text-xs uppercase tracking-[0.3em] font-bold rounded-full hover:opacity-80 transition-colors flex items-center justify-center gap-3"
            >
              <User className="w-4 h-4" /> Sign In with Google
            </button>
            
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="mt-6 text-[10px] uppercase tracking-widest text-[var(--accent-muted)] hover:text-[var(--fg)] transition-colors"
            >
              Back to Website
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (isAdminView && user?.email === import.meta.env.VITE_ADMIN_EMAIL && user?.emailVerified) {
    return (
      <ErrorBoundary>
        <div className={isDarkMode ? "" : "light"}>
          <AdminDashboard user={user} onLogout={handleLogout} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen selection:bg-[var(--accent)] selection:text-[var(--bg)] ${isDarkMode ? "" : "light"}`}>
        <div className="atmosphere" />
        <Navbar 
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        
        {loginError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-full text-xs uppercase tracking-widest backdrop-blur-md flex items-center gap-3">
            <AlertCircle className="w-4 h-4" />
            {loginError}
            <button onClick={() => setLoginError(null)} className="ml-2 hover:text-white transition-colors">✕</button>
          </div>
        )}

        <main>
          <Hero />
          <About />
          <Services />
          <Gallery />
          <Contact />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
