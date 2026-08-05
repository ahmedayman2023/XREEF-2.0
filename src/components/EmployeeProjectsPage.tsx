import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Trash2, X, LifeBuoy, Loader2, LogOut, Search, LayoutGrid, Folder, Clock, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logOut, fetchEmployeeProjects, createEmployeeProject, deleteEmployeeProject, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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

export default function EmployeeProjectsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [projects, setProjects] = useState<ProjectFolder[]>([]);
  const [employeeName, setEmployeeName] = useState('...');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectFolder | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !employeeId) return;
    
    // Fetch employee name
    const fetchName = async () => {
      try {
        const ref = doc(db, `users/${user.uid}/employees/${employeeId}`);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setEmployeeName(snapshot.data().name);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchName();

    setIsLoading(true);
    const unsubscribe = fetchEmployeeProjects(employeeId, (fetched) => {
      setProjects(fetched as ProjectFolder[]);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, employeeId]);

  const handleCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim() || !user || !employeeId) return;

    setActionError(null);
    try {
      const newProjectId = await createEmployeeProject(employeeId, newProjectName.trim());
      setNewProjectName('');
      setIsModalOpen(false);
      navigate(`/employee/${employeeId}/project/${newProjectId}`);
    } catch (err: any) {
      console.error("Error creating folder in database:", err);
      setActionError("فشل إنشاء المشروع. يرجى التحقق من الشبكة.");
    }
  };

  const deleteProjectHandler = (project: ProjectFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !user || !employeeId) return;
    setActionError(null);
    try {
      await deleteEmployeeProject(employeeId, projectToDelete.id);
      setProjectToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      setActionError("فشل حذف المشروع.");
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.folderName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  if (!isAuthReady || isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-neutral-400 font-medium text-sm animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 font-cairo selection:bg-blue-500/30 selection:text-white" dir="rtl">
      <nav className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-4 group">
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">XReef V3.0</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
             <Link to="/" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
               <ArrowRight size={16} /> العودة للموظفين
             </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <div className="mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight"
          >
            مشاريع الموظف: {employeeName}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 text-lg max-w-2xl"
          >
            هنا يمكنك إعداد وإدارة ساحات العمل (المشاريع) لهذا الموظف.
          </motion.p>
        </div>

        {actionError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4 text-red-400 text-sm font-medium"
          >
            <span>{actionError}</span>
            <button 
              onClick={() => setActionError(null)}
              className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text"
              placeholder="البحث في المشاريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#030712] border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
             <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 text-sm w-full md:w-auto"
             >
                <Plus size={18} />
                <span>إنشاء مشروع جديد</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="group cursor-pointer flex"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="w-full h-64 rounded-[2rem] bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02] border-2 border-dashed border-white/15 group-hover:border-blue-500/40 group-hover:bg-blue-500/[0.04] flex flex-col items-center justify-center transition-all duration-300 p-6 self-stretch">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all duration-300 mb-4 border border-white/5">
                <Plus size={32} className="text-neutral-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-bold text-lg text-neutral-300 group-hover:text-white transition-colors mb-2">إضافة مشروع</h3>
              <p className="text-xs text-neutral-500 text-center max-w-[180px]">اضغط لإنشاء مجلد مشروع جديد</p>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout animate-fadeIn">
            {filteredProjects.map((project, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={project.id}
                onClick={() => navigate(`/employee/${employeeId}/project/${project.id}`)}
                className="relative flex flex-col bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.15)] group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-5 relative z-10">
                   <div className={`p-4 rounded-2xl bg-gradient-to-br ${getGradient(project.id)} text-white shadow-md relative group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}>
                      <Folder className="w-8 h-8 opacity-90 relative z-10" />
                   </div>
                   <button 
                      onClick={(e) => deleteProjectHandler(project, e)} 
                      className="p-2.5 bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-xl transition-all border border-white/5"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>

                <div className="flex-1 relative z-10">
                   <h2 className="font-bold text-xl text-white mb-2 leading-tight group-hover:text-blue-400 truncate drop-shadow-sm">
                      {project.folderName}
                   </h2>
                   <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6 font-medium">
                      <Clock size={12} className="opacity-80 text-blue-400 drop-shadow-sm" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] relative z-10">
                   <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest drop-shadow-sm">صور المشروع</span>
                   <div className={`flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${getGradient(project.id)} bg-opacity-20 text-white text-xs font-bold rounded-full border border-white/20`}>
                      <span>{project.imageCount || 0} صور</span>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

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
              className="relative bg-[#0d111d] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">مشروع جديد</h2>
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
                     <label className="block text-sm font-semibold text-neutral-400 mb-2">اسم المشروع</label>
                     <input 
                       autoFocus
                       type="text"
                       value={newProjectName}
                       onChange={(e) => setNewProjectName(e.target.value)}
                       placeholder="مثال: تصميم معماري..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500/50 text-white placeholder-neutral-600 font-medium"
                     />
                  </div>
                  <div className="pt-2">
                     <button 
                       type="submit"
                       disabled={!newProjectName.trim()}
                       className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2"
                     >
                       <Plus size={20} />
                       إنشاء المشروع
                     </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative bg-[#0d111d] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl z-10"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-red-500" size={28} />
                </div>
                <h2 className="text-xl font-bold mb-3 text-white">حذف المشروع نهائياً؟</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed text-sm">
                  هل أنت متأكد تماماً من حذف المشروع <span className="text-white font-semibold flex mb-1">"{projectToDelete.folderName}"</span>؟ 
                  سيؤدي هذا إلى مسح كل ما يتعلق به.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setProjectToDelete(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl border border-white/5 text-sm"
                  >
                    تراجع
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm"
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
