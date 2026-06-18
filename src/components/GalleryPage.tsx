import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Folder, Image as ImageIcon, Search, Calendar, Download, 
  Copy, ExternalLink, Trash2, ArrowLeft, Loader2, LifeBuoy, LogOut, 
  ChevronLeft, ChevronRight, X, ZoomIn, Info, Check, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType, fetchFolders } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import Scene3D from './Scene3D';

interface ProjectFolder {
  id: string;
  folderName: string;
  createdAt: number;
}

interface GalleryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  folderId: string;
  folderName: string;
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const getDisplayUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.includes('firebasestorage.googleapis.com')) {
    return url;
  }
  return `/api/proxy?url=${encodeURIComponent(url)}`;
};

export default function GalleryPage() {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  
  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const navigate = useNavigate();

  // Handle Authentication Change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Folders and their Histories
  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      setFolders([]);
      setImages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // 1. Fetch all folders
    const unsubscribeFolders = fetchFolders((fetchedFolders) => {
      const foldersList = fetchedFolders as ProjectFolder[];
      setFolders(foldersList);

      if (foldersList.length === 0) {
        setImages([]);
        setIsLoading(false);
        return;
      }

      // 2. Setup real-time listeners for each folder's history subcollection
      const unsubscribesHistory: (() => void)[] = [];
      const historyStorage: { [folderId: string]: any[] } = {};

      foldersList.forEach((folder) => {
        const historyRef = collection(db, `users/${user.uid}/projects/${folder.id}/history`);
        const qHistory = query(historyRef, orderBy('timestamp', 'desc'));
        
        const unsub = onSnapshot(qHistory, (snapshot) => {
          const folderHistory: any[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            folderHistory.push({
              id: docSnap.id,
              url: data.url,
              prompt: data.prompt || '',
              timestamp: data.timestamp || Date.now(),
              folderId: folder.id,
              folderName: folder.folderName
            });
          });

          historyStorage[folder.id] = folderHistory;
          
          // Flatten all folders history to construct the main gallery active state
          const allImages: GalleryItem[] = [];
          foldersList.forEach(f => {
            if (historyStorage[f.id]) {
              allImages.push(...historyStorage[f.id]);
            }
          });

          // Sort descending by timestamp
          allImages.sort((a, b) => b.timestamp - a.timestamp);
          setImages(allImages);
          setIsLoading(false);
        }, (err) => {
          console.error(`Error loading history for folder ${folder.id}:`, err);
        });

        unsubscribesHistory.push(unsub);
      });

      return () => {
        unsubscribesHistory.forEach(unsub => unsub());
      };
    });

    return () => {
      unsubscribeFolders();
    };
  }, [user, isAuthReady]);

  // Handle Login
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

  // Filtered Images
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            img.folderName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = selectedFolderId === 'all' || img.folderId === selectedFolderId;
      return matchesSearch && matchesFolder;
    });
  }, [images, searchQuery, selectedFolderId]);

  // Grouped by Month
  const groupedImages = useMemo(() => {
    const groups: { [key: string]: { monthName: string, items: GalleryItem[] } } = {};
    
    filteredImages.forEach((img) => {
      const date = new Date(img.timestamp);
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const groupKey = `${year}-${monthIdx.toString().padStart(2, '0')}`;
      const monthName = `${ARABIC_MONTHS[monthIdx]} ${year}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          monthName,
          items: []
        };
      }
      groups[groupKey].items.push(img);
    });

    // Sort group keys in descending order (latest month first)
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        key,
        ...groups[key]
      }));
  }, [filteredImages]);

  // Copy Prompt Clipboard
  const handleCopyPrompt = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Download Image
  const handleDownloadImage = async (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(getDisplayUrl(url));
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `xreef_image_${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download image", err);
      // Fallback
      window.open(url, '_blank');
    }
  };

  // Delete Image
  const handleDeleteImage = async (img: GalleryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm("هل أنت متأكد من رغبتك في حذف هذه الصورة نهائياً من المعرض والمجلد الخاص بها؟");
    if (!confirmed || !user) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/projects/${img.folderId}/history`, img.id));
      
      // If we are deleting the active lightbox item, close it or select another one
      if (lightboxIndex !== null) {
        if (filteredImages.length <= 1) {
          setLightboxIndex(null);
        } else if (lightboxIndex >= filteredImages.length - 1) {
          setLightboxIndex(filteredImages.length - 2);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete image: ", err);
      alert("فشل حذف الصورة المحددة. يرجى المحاولة لاحقاً.");
    }
  };

  // Lightbox navigation
  const nextLightboxImage = () => {
    if (lightboxIndex !== null && lightboxIndex < filteredImages.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const prevLightboxImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(147,51,234,0.15),transparent_50%)]"></div>
        
        <div className="absolute inset-0 z-0 opacity-50 blur-sm mix-blend-screen pointer-events-none">
           <Scene3D className="h-full" showBorder={false} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent z-0"></div>

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
                <div className="relative bg-black border border-white/10 text-white rounded-2xl p-4 flex items-center justify-center gap-3 hover:border-white/20 transition duration-300">
                  {isAuthLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span className="font-bold text-sm tracking-wide">تسجيل الدخول بحساب Google</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="text-neutral-500 text-xs hidden md:block">
          جميع الحقوق محفوظة لشركة ريف الأمثل للاستشارات الهندسية © 2026
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 font-cairo selection:bg-blue-500/30 selection:text-white" dir="rtl">
      {/* Dynamic Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen scale-[1.15]">
          <Scene3D className="w-full h-full" showBorder={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/50"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Header element targeted by focus and styled precisely */}
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                <Folder size={16} />
                <span>المجلدات</span>
              </Link>
              <Link 
                to="/gallery" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-white shadow-sm"
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
        
        {/* Dynamic Mobile Nav Header */}
        <div className="flex sm:hidden items-center justify-center gap-2 mb-8 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
          <Link to="/" className="flex-1 text-center py-2 text-xs font-semibold text-neutral-400 rounded-lg">المجلدات</Link>
          <Link to="/gallery" className="flex-1 text-center py-2 text-xs font-semibold bg-white/5 text-white rounded-lg">المعرض</Link>
        </div>

        {/* Welcome Section */}
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-blue-400 font-medium tracking-wide">
              <ImageIcon size={14} />
              <span>أرشيفك البصري المتكامل</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3">معرض الصور / Gallery</h1>
            <p className="text-neutral-400 max-w-2xl text-base">
              تصفح واستعرض جميع عوالمك وحضاراتك التي قمت بتوليدها مسبقاً. يتم تصنيف الصور تلقائياً حسب أشهر السنة مع تحديد المجلد الذي تولدت منه.
            </p>
          </div>

          {/* Quick Statistics Stats widgets */}
          <div className="flex gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <div className="text-center px-4">
              <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">الصور الكلية</p>
              <p className="text-2xl font-black text-blue-400 font-sans">{images.length}</p>
            </div>
            <div className="w-px h-10 bg-white/10 my-auto"></div>
            <div className="text-center px-4">
              <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">المجلدات</p>
              <p className="text-2xl font-black text-purple-400 font-sans">{folders.length}</p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Options */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text"
              placeholder="ابحث بالوصف أو اسم المجلد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pr-11 pl-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition duration-200"
            />
          </div>

          {/* Folder Filter Links/Badges */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
            <button 
              onClick={() => setSelectedFolderId('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 ${selectedFolderId === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08]'}`}
            >
              <Filter size={12} />
              <span>الجميع ({images.length})</span>
            </button>
            
            {folders.map(folder => {
              const folderImagesCount = images.filter(img => img.folderId === folder.id).length;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 ${selectedFolderId === folder.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08]'}`}
                >
                  <Folder size={12} />
                  <span>{folder.folderName} ({folderImagesCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Infinite Gallery Content / Grid */}
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-neutral-400 font-medium">جاري سحب عوالمك الذكية من السحابة...</p>
          </div>
        ) : groupedImages.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.01] border border-white/[0.03] rounded-3xl p-12">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-neutral-600">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد صور متوفرة</h3>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              {searchQuery || selectedFolderId !== 'all' 
                ? "لم نجد أي صور تطابق خيارات التصفية أو البحث الذي أدخلته." 
                : "لم تقم بتوليد أي صور في مجلداتك بعد. توجه إلى أحد مجلداتك وابدأ التوليد الفوري!"}
            </p>
            {!(searchQuery || selectedFolderId !== 'all') && (
              <Link to="/" className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20">
                <Folder size={14} />
                <span>الذهاب للمجلدات وبدء التوليد</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            {groupedImages.map((group) => (
              <div key={group.key} className="space-y-6">
                
                {/* Month Classification Title Bar */}
                <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Calendar size={16} />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-wide">{group.monthName}</h2>
                  <span className="text-xs bg-white/[0.04] text-neutral-400 px-2.5 py-1 rounded-full font-mono font-medium">
                    {group.items.length} {group.items.length === 1 ? 'صورة' : 'صور'}
                  </span>
                </div>

                {/* Sub Image Grid for current month classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {group.items.map((img) => {
                    const originalIndex = filteredImages.findIndex(fi => fi.id === img.id);
                    return (
                      <motion.div 
                        key={img.id}
                        layoutId={`img-card-${img.id}`}
                        onClick={() => setLightboxIndex(originalIndex)}
                        className="group relative bg-[#070b19] border border-white/[0.04] p-3 rounded-2xl hover:border-white/10 transition-all duration-300 shadow-xl cursor-pointer overflow-hidden flex flex-col justify-between"
                        whileHover={{ y: -4 }}
                      >
                        {/* Interactive Image Frame */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-3">
                          <img 
                            src={getDisplayUrl(img.url)} 
                            alt={img.prompt} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-[#030712]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => handleCopyPrompt(img.id, img.prompt, e)}
                              className="p-2 bg-black/60 hover:bg-blue-600 rounded-lg text-white transition-colors"
                              title="نسخ الوصف المرجعي"
                            >
                              {copiedPromptId === img.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                            <button 
                              onClick={(e) => handleDownloadImage(img.url, img.id, e)}
                              className="p-2 bg-black/60 hover:bg-blue-600 rounded-lg text-white transition-colors"
                              title="تحميل بجودة كاملة"
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteImage(img, e)}
                              className="p-2 bg-black/60 hover:bg-red-600 rounded-lg text-white transition-colors"
                              title="حذف الصورة نهائياً"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Image Metadata Display */}
                        <div className="space-y-2">
                          {/* Prompt Line */}
                          <p className="text-neutral-300 text-xs leading-relaxed font-medium line-clamp-2" title={img.prompt}>
                            {img.prompt || 'صورة مولّدة بواسطة الذكاء الاصطناعي'}
                          </p>

                          {/* Folder Origin specification badge */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFolderId(img.folderId);
                              }}
                              className="text-[10px] font-bold text-neutral-400 hover:text-blue-400 bg-white/[0.02] hover:bg-blue-500/10 px-2 py-1 rounded-md flex items-center gap-1 transition-all"
                            >
                              <Folder size={10} className="text-blue-400 shrink-0" />
                              <span className="truncate max-w-[100px]">{img.folderName}</span>
                            </span>

                            <span className="text-[9px] font-mono font-medium text-neutral-500">
                              {new Date(img.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* Fullscreen Interactive Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col md:flex-row items-stretch"
            dir="rtl"
          >
            {/* Left/Main Image Stage */}
            <div className="flex-1 relative flex items-center justify-center p-4">
              
              <button 
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors z-10"
                title="إغلاق المعاينة"
              >
                <X size={20} />
              </button>

              <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                <button 
                  onClick={(e) => handleCopyPrompt(filteredImages[lightboxIndex].id, filteredImages[lightboxIndex].prompt, e)}
                  className="px-4 py-2 bg-white/5 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/5"
                >
                  {copiedPromptId === filteredImages[lightboxIndex].id ? (
                    <>
                      <Check size={14} className="text-green-400" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>نسخ الوصف</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={(e) => handleDownloadImage(filteredImages[lightboxIndex].url, filteredImages[lightboxIndex].id, e)}
                  className="px-4 py-2 bg-white/5 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/5"
                >
                  <Download size={14} />
                  <span>تحميل الصورة</span>
                </button>
              </div>

              {/* Navigation Elements */}
              {lightboxIndex > 0 && (
                <button 
                  onClick={prevLightboxImage}
                  className="absolute right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors select-none"
                  title="الصورة السابقة"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              {lightboxIndex < filteredImages.length - 1 && (
                <button 
                  onClick={nextLightboxImage}
                  className="absolute left-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors select-none"
                  title="الصورة التالية"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Main Image View */}
              <motion.img 
                key={filteredImages[lightboxIndex].id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={getDisplayUrl(filteredImages[lightboxIndex].url)}
                alt="Fullscreen generated preview"
                className="max-h-[80vh] max-w-full md:max-h-[90vh] rounded-2xl object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Right Information Drawer Side Panel */}
            <div className="w-full md:w-80 bg-neutral-900 border-t md:border-t-0 md:border-r border-white/10 p-6 flex flex-col justify-between overflow-y-auto">
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                    <Info size={12} /> المواصفات والبيانات
                  </h3>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">اسم المجلد:</span>
                      <span className="text-white font-medium">{filteredImages[lightboxIndex].folderName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">تاريخ التوليد:</span>
                      <span className="text-white font-medium">{new Date(filteredImages[lightboxIndex].timestamp).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">وقت التوليد:</span>
                      <span className="text-white font-medium">{new Date(filteredImages[lightboxIndex].timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">الصيغة:</span>
                      <span className="text-green-400 font-bold">PNG Image</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} /> وصف الذكاء الاصطناعي (Prompt)
                  </h3>
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <p className="text-xs text-neutral-200 leading-relaxed font-medium font-mono text-left" dir="ltr">
                      {filteredImages[lightboxIndex].prompt || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 mt-6 md:mt-0">
                <button 
                  onClick={() => handleDeleteImage(filteredImages[lightboxIndex!])}
                  className="w-full bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 p-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Trash2 size={14} />
                  <span>حذف الصورة نهائياً</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Footer block */}
      <footer className="border-t border-white/[0.04] bg-[#050913] mt-24 py-12 relative z-10 no-print">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex flex-col gap-2 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold mb-1">
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px]">XR</div>
              <span>XREEF 2.0</span>
            </div>
          </div>
          
          <div className="text-center md:text-left text-[11px] text-neutral-500">
            <span>جميع الحقوق محفوظة لشركة ريف الأمثل للاستشارات الهندسية © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
