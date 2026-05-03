import { 
  LogOut, 
  Terminal as TerminalIcon, 
  LayoutGrid, 
  BarChart3, 
  Settings 
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";

export function Header({ user }: { user: any }) {
  return (
    <nav className="h-16 border-b border-white/5 bg-black/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl flex items-center justify-center rotate-6 shadow-lg shadow-purple-500/20">
          <div className="w-5 h-5 border-2 border-white rounded-md -rotate-6"></div>
        </div>
        <div>
          <span className="text-white font-display font-bold tracking-tighter text-2xl leading-none">
            SMARTVEX <span className="text-purple-500 font-light ml-1 opacity-80">CORE_V2</span>
          </span>
          <div className="flex items-center gap-3 text-[9px] font-mono mt-1 opacity-40">
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-green-500"></div> API_ONLINE</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse"></div> GPU_READY</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-8 bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <div className="flex flex-col items-end">
            <span className="text-white text-[11px] font-bold leading-none">{user.displayName}</span>
            <span className="text-[9px] text-purple-500/80 font-mono tracking-tighter uppercase font-bold">
              {user.isGuest ? 'LOCAL_GUEST' : 'IDENTITY_VERIFIED'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 overflow-hidden shadow-inner">
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
        <button 
          onClick={async () => {
            if (user.isGuest) {
              localStorage.removeItem('guest_uid');
              window.location.reload();
            } else {
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="p-3 hover:bg-rose-500/10 rounded-xl text-gray-500 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const handleClick = (feature: string) => {
    alert(`Redirecionando para o módulo: ${feature} (${feature} indisponível na arquitetura free)`);
  };

  return (
    <aside className="w-20 border-r border-white/5 flex flex-col items-center py-10 gap-12 shrink-0 bg-black/40 relative z-10">
      <motion.div whileHover={{ scale: 1.1 }} className="text-purple-500 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-purple-500/10 p-3 rounded-2xl">
        <LayoutGrid className="w-6 h-6" />
      </motion.div>
      <motion.div 
        whileHover={{ scale: 1.1 }} 
        onClick={() => handleClick('Analytics')}
        className="opacity-40 hover:opacity-100 cursor-pointer hover:text-purple-500 transition-all p-3"
      >
        <BarChart3 className="w-6 h-6" />
      </motion.div>
      <motion.div 
        whileHover={{ scale: 1.1 }} 
        onClick={() => handleClick('Server Terminal')}
        className="opacity-40 hover:opacity-100 cursor-pointer hover:text-purple-500 transition-all p-3"
      >
        <TerminalIcon className="w-6 h-6" />
      </motion.div>
      <motion.div 
        whileHover={{ scale: 1.1 }} 
        onClick={() => handleClick('Settings')}
        className="mt-auto mb-6 opacity-40 hover:opacity-100 cursor-pointer transition-all p-3"
      >
        <Settings className="w-6 h-6" />
      </motion.div>
    </aside>
  );
}
