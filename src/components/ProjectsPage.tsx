import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, X, LifeBuoy, Loader2, Sparkles, LogOut, Image as ImageIcon, Search, LayoutGrid, Folder, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType, fetchFolders, createProjectFolder } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import Scene3D from './Scene3D';

interface ProjectFolder {
  id: string;
  folderName: string;
  createdAt: number;
  imageCount?: number;
}

const getGradient = (id: string) => {
  const colors = [
    'from-blue-600 to-indigo-600',
    'from-violet-600 to-purple-600',
    'from-fuchsia-600 to-pink-600',
    'from-rose-600 to-red-600',
    'from-orange-600 to-amber-600',
    'from-emerald-600 to-teal-600',
    'from-cyan-600 to-blue-600'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'طاب مساؤك';
};

export default function ProjectsPage() {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectFolder | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Persistent Real-time Data Binding directly from Firestore upon mount
  useEffect(() => {
    if (!isAuthReady) return;

    if (user) {
      setIsLoadingFolders(true);
      setFetchError(null);
      let unsubscribeFolders: (() => void) | undefined;
      
      try {
        unsubscribeFolders = fetchFolders((fetchedFolders) => {
          setFolders(fetchedFolders as ProjectFolder[]);
          setIsLoadingFolders(false);
        });
      } catch (err: any) {
        console.error("Failed to query folders collection from Firestore:", err);
        setFetchError("لم نتمكن من الاتصال بالخادم لاسترجاع مجلداتك. يرجى المحاولة لاحقاً.");
        setIsLoadingFolders(false);
      }

      return () => {
        if (unsubscribeFolders) unsubscribeFolders();
      };
    } else {
      setFolders([]);
      setIsLoadingFolders(false);
    }
  }, [user, isAuthReady]);

  const handleGoogleAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError("حدث خطأ أثناء تسجيل الدخول بحساب Google. يرجى التحقق من اتصالك.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim() || !user) return;

    setActionError(null);
    try {
      const newFolderId = await createProjectFolder(newProjectName.trim());
      setNewProjectName('');
      setIsModalOpen(false);
      navigate(`/project/${newFolderId}`);
    } catch (err: any) {
      console.error("Error creating folder in database:", err);
      setActionError("فشل إنشاء المجلد. يرجى التحقق من اتصال شبكتك وإعادة المحاولة.");
    }
  };

  const deleteProject = (folder: ProjectFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(folder);
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !user) return;
    setActionError(null);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/folders`, projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete folder document in Firestore:", err);
      setActionError("فشل حذف المجلد المطلوب. يرجى المحاولة لاحقاً.");
    }
  };

  const filteredProjects = useMemo(() => {
    return folders.filter(f => f.folderName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [folders, searchQuery]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-neutral-400 font-medium text-sm animate-pulse">جاري فحص حالة الجلسة...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] text-white font-cairo flex flex-col items-center justify-between overflow-hidden relative py-12" dir="rtl">
        {/* Abstract animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(147,51,234,0.15),transparent_50%)]"></div>
        
        <div className="absolute inset-0 z-0 opacity-50 blur-sm mix-blend-screen pointer-events-none">
           <Scene3D className="h-full" showBorder={false} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent z-0"></div>


        {/* Top spacer to align center */}
        <div className="hidden md:block"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-lg w-full px-6 my-auto"
        >
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-500/10 p-4 rounded-2xl mb-8 border border-blue-500/20">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              
              <h1 className="text-4xl font-extrabold text-white mb-4 text-center tracking-tight font-sans">XREEF 2.0</h1>
              <p className="text-gray-300 text-center mb-10 text-base leading-relaxed">
                XREEF is an advanced AI-powered image generation platform designed to create high-quality, creative visuals.
              </p>

              {authError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm text-center font-medium">
                  {authError}
                </motion.div>
              )}

              <button 
                onClick={handleGoogleAuth}
                disabled={isAuthLoading}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-[#090b14] border border-white/10 hover:border-white/20 hover:bg-[#0c0f1a] text-white font-semibold py-4 px-6 rounded-2xl transition-all flex justify-center items-center gap-3">
                  {isAuthLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>المتابعة باستخدام حساب Google</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Global Footer for verification and OAuth compliance containing exact static HTML files hosted */}
        <footer className="relative z-10 w-full max-w-lg px-6 text-center no-print mt-8">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 font-medium">
            <a 
              href="/privacy.html" 
              className="hover:text-blue-400 transition-colors duration-200 underline decoration-white/10 hover:decoration-blue-400/50 underline-offset-4"
            >
              سياسة الخصوصية / Privacy Policy
            </a>
            <span className="text-white/10 select-none">•</span>
            <a 
              href="/terms.html" 
              className="hover:text-blue-400 transition-colors duration-200 underline decoration-white/10 hover:decoration-blue-400/50 underline-offset-4"
            >
              شروط الخدمة / Terms of Service
            </a>
          </div>
          <p className="text-[10px] text-gray-500 mt-3 tracking-wide">
            © 2026 XReef. جميع الحقوق محفوظة.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 font-cairo selection:bg-blue-500/30 selection:text-white" dir="rtl">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen scale-[1.15]">
          <Scene3D className="w-full h-full" showBorder={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/50"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <nav className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">XREEF 2.0</h1>
            </Link>
            
            <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-white shadow-sm"
              >
                <Folder size={16} />
                <span>المجلدات</span>
              </Link>
              <Link 
                to="/gallery" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                <ImageIcon size={16} />
                <span>المعرض</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/support')}
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              <LifeBuoy size={18} /> الدعم المباشر
            </button>
            <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-white/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 text-sm font-bold">
                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user.displayName || user.email?.split('@')[0]}</p>
              </div>
              <button 
                onClick={() => logOut()}
                className="p-2 ml-2 text-neutral-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
        
        {/* Welcome Hero */}
        <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight"
            >
              {getGreeting()}، {user.displayName?.split(' ')[0] || 'المبدع'} <span className="opacity-70">✨</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-neutral-400 text-lg max-w-2xl"
            >
              مرحباً بك في مساحة عملك الخاصة. قم بتنظيم جميع مشاريع توليد الصور المتقدمة في مجلدات آمنة ومزامنتها لحظياً بالكامل.
            </motion.p>
          </div>
          
          <div className="w-full md:w-auto flex md:justify-end">
             {/* Engine Status */}
             <div className="px-5 py-3 rounded-2xl border border-white/10 shadow-lg bg-black/40 backdrop-blur-md inline-flex items-center">
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                   <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">مجلدات السحابة نشطة</span>
                </div>
             </div>
          </div>
        </div>

        {/* Global Error Notice for Network / Firestore */}
        {(fetchError || actionError) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4 text-red-400 text-sm font-medium"
          >
            <span>{fetchError || actionError}</span>
            <button 
              onClick={() => { setFetchError(null); setActionError(null); }}
              className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Dynamic & Premium Redesigned Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text"
              placeholder="البحث في المجلدات والملفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#030712] border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
             <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transform hover:-translate-y-0.5 text-sm w-full md:w-auto"
             >
                <Plus size={18} />
                <span>إنشاء مجلد جديد</span>
             </button>
             <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex items-center">
                 <button className="px-4 py-2 bg-white/10 rounded-xl text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2">
                    <LayoutGrid size={14} /> الشبكة
                 </button>
             </div>
          </div>
        </div>

        {/* Folders Workspace Content */}
        {isLoadingFolders ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 max-w-4xl mx-auto backdrop-blur-sm">
             <Loader2 className="w-14 h-14 text-blue-500 animate-spin mb-5" />
             <h3 className="text-xl font-bold text-white mb-2">جاري استرجاع مجلداتك</h3>
             <p className="text-neutral-400 text-sm">يقوم النظام بالمزامنة المباشرة مع Firestore لضمان استقرار لبياناتك...</p>
          </div>
        ) : (
          <div>
            {/* Grid display of responsive columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              
              {/* Dynamic trigger card to create folders inside the grid */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer flex"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="w-full h-64 rounded-[2rem] bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02] border-2 border-dashed border-white/15 group-hover:border-blue-500/40 group-hover:bg-blue-500/[0.04] flex flex-col items-center justify-center transition-all duration-300 p-6 self-stretch">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all duration-300 mb-4 border border-white/5 group-hover:border-blue-500/20">
                    <Plus size={32} className="text-neutral-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-bold text-lg text-neutral-300 group-hover:text-white transition-colors mb-2">إنشاء مجلد إبداعي</h3>
                  <p className="text-xs text-neutral-500 text-center max-w-[180px]">اضغط هنا لتنظيم مجموعة جديدة من صور الذكاء الاصطناعي</p>
                </div>
              </motion.div>

              <AnimatePresence mode="popLayout animate-fadeIn">
                {filteredProjects.map((folder, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={folder.id}
                    onClick={() => navigate(`/project/${folder.id}`)}
                    className="relative flex flex-col bg-[#0b0f19]/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.15)] group overflow-hidden cursor-pointer"
                  >
                    {/* Top actions & visual badges */}
                    <div className="flex items-start justify-between mb-5 select-none relative z-10">
                       <div className={`p-4 rounded-2xl bg-gradient-to-br ${getGradient(folder.id)} text-white shadow-md relative group-hover:scale-105 transition-transform duration-300`}>
                          <Folder className="w-8 h-8 opacity-90" />
                          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       </div>
                       <button 
                          onClick={(e) => deleteProject(folder, e)} 
                          className="p-2.5 bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-xl transition-all border border-white/5"
                          title="حذف المجلد"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>

                    {/* General Text Metadata */}
                    <div className="flex-1 relative z-10">
                       <h2 className="font-bold text-xl text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors truncate" title={folder.folderName}>
                          {folder.folderName}
                       </h2>
                       
                       <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6 font-medium">
                          <Clock size={12} className="opacity-60 text-blue-400" />
                          <span>{new Date(folder.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                       </div>
                    </div>

                    {/* Image Counter & Detail Footer Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] relative z-10">
                       <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">محتويات السحابة</span>
                       <div className={`flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${getGradient(folder.id)} bg-opacity-10 text-white text-xs font-bold rounded-full border border-white/10 shadow-sm`}>
                          <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          <span>{folder.imageCount || 0} صور</span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Secondary Empty State / Query Filter mismatch fallback */}
        {!isLoadingFolders && searchQuery && filteredProjects.length === 0 && (
          <div className="py-24 text-center bg-white/[0.01] border border-white/5 rounded-[2rem] max-w-lg mx-auto backdrop-blur-sm">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
               <Search className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج مطابقة</h3>
            <p className="text-neutral-400 text-sm px-6">لا يتوفر أي مجلد به اسم يطابق البحث "{searchQuery}". يرجى التحقق من الأحرف والكلمات.</p>
          </div>
        )}

        {/* Core Empty State with actionable layout */}
        {!isLoadingFolders && !searchQuery && folders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 md:py-24 text-center max-w-2xl mx-auto"
          >
            <div className="relative mb-8 inline-block select-none">
              <div className="absolute inset-0 bg-blue-500/25 rounded-full blur-3xl scale-125"></div>
              <div className="w-28 h-28 bg-[#090e18] rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto relative z-10 transition-colors">
                 <Folder className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">مساحة العمل فارغة</h3>
            <p className="text-neutral-400 max-w-md mx-auto mb-10 leading-relaxed text-sm md:text-base">
              ابدأ بتنظيم وإدارة إبداعاتك ومشاريعك التوليدية عن طريق إنشاء مجلدك الأول الآن للبدء برسم ملامح ذكائك الاصطناعي.
            </p>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4.5 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
            >
              <Plus size={20} />
              <span>إنشاء المجلد الأول</span>
            </button>
          </motion.div>
        )}

      </main>

      {/* Professional Footer for XREEF */}
      <footer className="border-t border-white/[0.04] bg-[#050913] mt-24 py-12 relative z-10 no-print">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex flex-col gap-2 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-sans font-bold text-sm">
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px]">XR</div>
              <span>XREEF 2.0</span>
            </div>
          </div>
          
          <div className="text-center md:text-left text-[11px] text-neutral-500">
            <span>جميع الحقوق محفوظة لشركة ريف الأمثل للاستشارات الهندسية © 2026</span>
          </div>
        </div>
      </footer>

      {/* Renders dynamic modal container for Folder creation */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0d111d] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -z-10 rounded-full"></div>
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">مجلد سحابي جديد</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-neutral-500 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="space-y-6">
                  <div>
                     <label className="block text-sm font-semibold text-neutral-400 mb-2">اسم المجلد</label>
                     <input 
                       autoFocus
                       type="text"
                       value={newProjectName}
                       onChange={(e) => setNewProjectName(e.target.value)}
                       placeholder="مثال: صور تسويقية، خيال علمي..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-white placeholder-neutral-600 font-medium"
                     />
                  </div>
                  <div className="pt-2">
                     <button 
                       type="submit"
                       disabled={!newProjectName.trim()}
                       className="w-full bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2"
                     >
                       <Plus size={20} />
                       إنشاء مجلد العمل
                     </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Renders delete confirmation modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0d111d] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -z-10 rounded-full"></div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-red-500" size={28} />
                </div>
                <h2 className="text-xl font-bold mb-3 text-white">حذف المجلد نهائياً؟</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed text-sm">
                  هل أنت متأكد تماماً من حذف مجلد <span className="text-white font-semibold block mb-1">"{projectToDelete.folderName}"</span>؟ 
                  سيؤدي هذا إلى مسح سجل الصور المرتبطة به ولن تتمكن من التراجع عن هذا الإجراء.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setProjectToDelete(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-all border border-white/5 text-sm"
                  >
                    تراجع
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-900/20 text-sm"
                  >
                    نعم، احذف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
