import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaBarsStaggered, FaXmark
} from 'react-icons/fa6';
import { useAppContext } from '@/contexts/AppContext';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme } = useAppContext();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const closeMenu = () => setIsMenuOpen(false);

    const isDashboard = location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/teacher') ||
        location.pathname.startsWith('/student');

    if (isDashboard) {
        return null;
    }

    return (
        <nav className={`fixed top-0 w-full z-[9999] transition-all duration-500 ${scrolled ? (theme === 'dark' ? 'bg-black/80 backdrop-blur-2xl border-b border-white/5' : 'bg-white/80 backdrop-blur-2xl border-b border-black/5') : 'bg-transparent'} py-4`}>
            <div className="container mx-auto px-6 md:px-12 flex justify-between items-center bg-black/50 backdrop-blur-md rounded-2xl py-2">
                <Link to="/" className="text-2xl font-black tracking-tighter z-[10001] flex items-center gap-2">
                    <span className={`${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} px-2 py-0.5 rounded-sm italic`}>CW</span>
                    <span className="opacity-40 italic">akademiya</span>
                </Link>

                <div className="flex items-center gap-6">
                    <ul className="hidden lg:flex gap-10 items-center">
                        <li>
                            <Link to="/login" className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all italic px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'text-white bg-white/10 hover:bg-white/20' : 'text-black bg-black/10 hover:bg-black/20'}`}>
                                Kirish (Login)
                            </Link>
                        </li>
                    </ul>

                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`lg:hidden z-[10001] p-2 outline-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {isMenuOpen ? <FaXmark size={30} /> : <FaBarsStaggered size={26} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 z-[10000] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible translate-x-full'} ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                <div className="flex flex-col justify-center h-full px-12 gap-10">
                    <Link to="/login" onClick={closeMenu} className={`text-5xl font-black uppercase transition-all tracking-tighter italic ${theme === 'dark' ? 'text-white hover:text-white/70' : 'text-black hover:text-black/70'}`}>
                        Kirish
                    </Link>
                </div>
            </div>
        </nav>
    );
}
