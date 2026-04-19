import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  FaReact, FaPython, FaRocket, FaMobile, FaChevronRight,
  FaBarsStaggered, FaXmark, FaEnvelope, FaLock, FaUser,
  FaTelegram, FaInstagram, FaGithub, FaTerminal, FaCodeBranch, FaServer
} from 'react-icons/fa6';

export default function Home() {
  const { theme } = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isMenuOpen || authModal.open) ? 'hidden' : 'unset';
  }, [isMenuOpen, authModal]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className={`min-h-screen bg-[#050505] text-[#eee] font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden`}>

      {/* ============ 1. NAVIGATION ============ */}
      <nav className={`fixed top-0 w-full z-[9999] transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/5' : 'bg-transparent'} py-4 md:py-6`}>
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <a href="#" className="text-2xl font-black tracking-tighter z-[10001] flex items-center gap-2">
            <span className={`bg-white text-black px-2 py-0.5 rounded-sm italic`}>CW</span>
            <span className="opacity-40 italic">akademiya</span>
          </a>

          <div className="flex items-center gap-4 xl:gap-8">
            <ul className="hidden xl:flex gap-6 2xl:gap-10 items-center">
              {['Kurslar', 'Metodika', 'Mentorlar', 'FAQ'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className={`text-[11px] font-bold tracking-[0.3em] uppercase transition-all italic whitespace-nowrap text-white/30 hover:text-white`}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`xl:hidden z-[10001] p-2 outline-none flex-shrink-0 text-white`}>
              {isMenuOpen ? <FaXmark size={30} /> : <FaBarsStaggered size={26} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ============ 2. MOBILE MENU ============ */}
      <div className={`fixed inset-0 z-[10000] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible translate-x-full'} bg-black`}>
        <div className="flex flex-col justify-center h-full px-12 gap-10">
          {['Kurslar', 'Metodika', 'Mentorlar', 'FAQ'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={closeMenu} className={`text-5xl font-black uppercase transition-all tracking-tighter italic text-white/10 hover:text-white`}>
              {item}
            </a>
          ))}
          <button onClick={() => { closeMenu(); setAuthModal({ open: true, mode: 'login' }); }} className={`w-full py-5 border font-black text-xs tracking-[0.4em] uppercase border-white/20 text-white`}>
            Tizimga Kirish
          </button>
        </div>
      </div>

      {/* ============ 3. MODAL (O'zgarishsiz qoldi) ============ */}
      {authModal.open && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setAuthModal({ ...authModal, open: false })}></div>
          <div className="relative w-full max-w-[480px] bg-[#0a0a0a] border border-white/10 p-10 md:p-14 shadow-2xl rounded-sm text-white">
            <button onClick={() => setAuthModal({ ...authModal, open: false })} className="absolute top-6 right-6 text-white/20 hover:text-white">
              <FaXmark size={24} />
            </button>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 italic">{authModal.mode === 'login' ? 'Xush kelibsiz' : 'Yangi Muhandis'}</h2>
            <p className="text-[10px] tracking-widest text-white/20 uppercase mb-10 italic">O'z kelajagingizni biz bilan quring</p>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {authModal.mode === 'register' && (
                <div className="relative group">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white transition-colors" />
                  <input type="text" placeholder="TO'LIQ ISM" className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-[11px] font-bold tracking-widest outline-none focus:border-white transition-all uppercase" />
                </div>
              )}
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white transition-colors" />
                <input type="email" placeholder="EMAIL MANZIL" className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-[11px] font-bold tracking-widest outline-none focus:border-white transition-all uppercase" />
              </div>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white transition-colors" />
                <input type="password" placeholder="MAXFIY KALIT" className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-[11px] font-bold tracking-widest outline-none focus:border-white transition-all uppercase" />
              </div>
              <button onClick={() => window.location.href = '/teacher'} className="w-full bg-white text-black py-5 font-black text-[11px] tracking-[0.5em] uppercase hover:invert transition-all">
                {authModal.mode === 'login' ? 'KIRISH' : 'DAVOM ETISH'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[9px] text-white/40 uppercase tracking-widest mb-3">O'QITUVCHIlar uchun:</p>
              <a href="/teacher" className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center font-black text-[11px] tracking-widest uppercase rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                O'qituvchi Paneli
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============ 4. HERO SECTION ============ */}
      <section className={`relative min-h-screen flex items-center pt-24 overflow-hidden border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <h4 className="text-[12vw] md:text-[8vw] font-black leading-[0.8] tracking-tighter uppercase mb-8 italic">
              o'rganishdan<br /> <span className={`not-italic tracking-[-0.05em] ${theme === 'dark' ? 'text-white/10' : 'text-black/10'}`}>ishgacha</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-16 items-start">
              <p className={`text-xl md:text-4xl font-light leading-tight ${theme === 'dark' ? 'text-white/40' : 'text-black/50'}`}>
                Bizda shunchaki dars o'tilmaydi. Biz sizga <span className={`${theme === 'dark' ? 'text-white' : 'text-black'} underline decoration-current italic`}>global bozorda</span> munosib o'rin topishingiz uchun muhandislik madaniyatini o'rgatamiz.
              </p>
              <div className="flex flex-col gap-10">
                <div className={`grid grid-cols-2 gap-8 border-l pl-8 ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                  <div>
                    <div className="text-4xl font-black italic">450+</div>
                    <div className="text-[9px] tracking-widest uppercase opacity-30 font-bold">Muvaffaqiyatli Bitiruvchi</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black italic">12+</div>
                    <div className="text-[9px] tracking-widest uppercase opacity-30 font-bold">Yillik Tajriba</div>
                  </div>
                </div>
                <button className={`px-16 py-6 border text-[11px] font-black tracking-[0.5em] uppercase transition-all self-start ${theme === 'dark' ? 'border-white/20 hover:bg-white hover:text-black' : 'border-black/20 hover:bg-black hover:text-white'}`}>
                  O'zingizni sinab ko'ring
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full blur-[120px] -z-10 ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}></div>
      </section>

      {/* ============ 5. COURSES SECTION ============ */}
      <section id="kurslar" className={`py-40 transition-colors ${theme === 'dark' ? 'bg-[#080808]' : 'bg-[#ffffff]'}`}>
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <h2 className={`text-6xl md:text-9xl font-black tracking-tighter uppercase italic opacity-10 leading-none`}>Yo'nalishlar.</h2>
            <p className={`max-w-sm text-[10px] tracking-[0.3em] uppercase font-bold text-right leading-relaxed italic opacity-40`}>
              Har bir kurs — bu real loyihalar va <br /> xalqaro standartlar yig'indisi.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} border`}>
            {[
              { t: "Frontend Muhandisligi", i: FaReact, d: "Faqat React emas, balki yuqori yuklamali interfeyslar arxitekturasini o'rganing.", s: "React, Next.js, TypeScript, Tailwind" },
              { t: "Backend Tizimlar", i: FaPython, d: "Ma'lumotlar bazasi, xavfsizlik va serverlar dunyosiga chuqur sho'ng'ing.", s: "FastAPI, PostgreSQL, Redis, Docker" },
              { t: "Mobil Ekotizim", i: FaMobile, d: "iOS va Android uchun zamonaviy va tezkor ilovalar yaratish mahorati.", s: "React Native, Flutter, Swift, Kotlin" },
              { t: "Cloud & DevOps", i: FaRocket, d: "Loyiha qanday qilib millionlab foydalanuvchilar uchun xizmat qilishini tushuning.", s: "AWS, CI/CD, Kubernetes, Linux" },
              { t: "Fullstack Master", i: FaCodeBranch, d: "G'oyadan production darajasigacha bo'lgan barcha bosqichlarni o'zingiz boshqaring.", s: "Node.js, GraphQL, Prisma, AWS" },
              { t: "Kiberxavfsizlik", i: FaServer, d: "Tizimlarni himoya qilish va zaifliklarni aniqlash bo'yicha amaliy ko'nikmalar.", s: "Ethical Hacking, Network Security" }
            ].map((c, i) => (
              <div key={i} className={`group p-12 transition-all duration-700 cursor-pointer ${theme === 'dark' ? 'bg-black hover:bg-[#0c0c0c]' : 'bg-white hover:bg-neutral-50'}`}>
                <c.i className={`text-4xl transition-all duration-500 mb-12 ${theme === 'dark' ? 'text-white/10 group-hover:text-white' : 'text-black/10 group-hover:text-black'}`} />
                <h3 className="text-2xl font-bold mb-6 uppercase italic tracking-tighter">{c.t}</h3>
                <p className="opacity-40 text-sm font-light leading-relaxed mb-8">{c.d}</p>
                <div className="text-[9px] tracking-widest opacity-20 uppercase mb-12 font-bold">{c.s}</div>
                <button className="flex items-center gap-4 text-[9px] font-black tracking-[0.4em] uppercase group-hover:translate-x-4 transition-all">
                  Kurs Sillabusi <FaChevronRight size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className={`py-24 border-t ${theme === 'dark' ? 'bg-black border-white/5' : 'bg-white border-black/5'}`}>
        <div className="container mx-auto px-6 md:px-12 text-center">
          <div className="text-3xl font-black tracking-tighter italic mb-10 uppercase opacity-20">CourseWeb</div>
          <div className="flex justify-center gap-10 mb-10 opacity-30">
            <FaTelegram className="text-2xl hover:opacity-100 transition-opacity cursor-pointer" />
            <FaInstagram className="text-2xl hover:opacity-100 transition-opacity cursor-pointer" />
            <FaGithub className="text-2xl hover:opacity-100 transition-opacity cursor-pointer" />
          </div>
          <p className="text-[10px] tracking-[0.5em] opacity-20 uppercase italic font-bold">Buxoro muhandislik akademiyasi // 2026</p>
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${theme === 'dark' ? '#050505' : '#f5f5f5'}; }
        ::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#333' : '#ccc'}; }
      `}</style>
    </div>
  );
}