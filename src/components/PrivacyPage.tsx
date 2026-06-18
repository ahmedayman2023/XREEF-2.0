import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Printer, Shield, Eye, Database, Share2, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 font-cairo selection:bg-blue-500/30 selection:text-white pb-20 relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-lg no-print">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"
              title="العودة للوحة التحكم / Back to Dashboard"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white font-sans">XReef</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Lang switcher */}
            <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex items-center gap-1">
              <button 
                onClick={() => setLang('ar')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'ar' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                العربية
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                English
              </button>
            </div>

            <button 
              onClick={handlePrint}
              className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-neutral-400 rounded-xl transition-all"
              title="طباعة / Print"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0b0f19]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl -z-10 rounded-full"></div>

          {lang === 'ar' ? (
            /* ARABIC VERSION */
            <div className="space-y-10">
              <div className="border-b border-white/[0.06] pb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
                  <Shield size={12} />
                  <span>آخر تحديث: 15 يونيو 2026</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">سياسة الخصوصية لمنصة XReef</h1>
                <p className="text-neutral-400 mt-3 text-base sm:text-lg">نحن في XReef ملتزمون بحماية سرية وأمن عروض الأسعار وبيانات المشاريع الإدارية الخاصة بك.</p>
              </div>

              {/* Quick Outline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-none">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                  <Eye className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">الشفافية أولاً</h4>
                    <p className="text-neutral-400">نوضح بدقة وبكل تواضع نوع البيانات المسجلة وكيفية تدبيرها.</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                  <Database className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">تخزين سحابي محمي</h4>
                    <p className="text-neutral-400">تُحفظ كافة ملفاتك وعروض أسعارك بشكل مشفر ومعزول كلياً.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-neutral-300 text-sm sm:text-base leading-relaxed">
                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">1</span>
                    مقدمة وتمهيد
                  </h2>
                  <p>
                    مرحباً بك في منصة <strong>XReef</strong> لنظم تقديم العروض ومتابعة المشاريع. نحن ندرك مدى حساسية جداول الأعمال والحسابات المالية والتوصيفات المالية والتفاصیل الإدارية لمشاريعك، لذا نلتزم بتطبیق معاییر رصینة لحفظ خصوصیتك في الفضاء السحابي.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">2</span>
                    المعلومات التي نقوم بجمعها
                  </h2>
                  <div className="space-y-2">
                    <p>لكي تعمل الخدمة بكفاءة، نقوم بجمع:</p>
                    <ul class="list-disc list-inside pr-4 space-y-1.5 text-neutral-400">
                      <li>توصیفات حساب المستخدم الأساسية (الاسم، والبريد الإلكتروني، والصورة) المستخلصة عبر Google authentication الآمن.</li>
                      <li>ملفات وهیاكل عروض الأسعار التفصيلية والبنود الحتمية للمشروع.</li>
                      <li>بيانات المتصفح وسلسلة الأنشطة ومعلومات الأوقات لتأمين وحفظ توازن المنصة سحابياً.</li>
                    </ul>
                  </div>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">3</span>
                    كيفية استخدام بياناتك
                  </h2>
                  <p>
                    تقتصر عملیات معالجة البيانات لدينا لتمكینك من صیاغة جداول تسعیر المشاريع وتصنيفها وتحميل الفواتير، ومزامنة مجلدات عروض الأسعار مع خوادم Firebase السحابية، وتقديم إشعارات الدعم إذا واجهت أخطاء برمجية في معالجة القیم الحسابية الضريبة أو تتبع تدفق الأعمال.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">4</span>
                    تخزين البيانات وأمنها السحابي
                  </h2>
                  <p>
                    نستعين بخوادم سحابية آمنة خاضعة لحوكمة فائقة من Google Cloud. كما نطبق قواعد أمان قواعد البيانات (Firestore Security Rules) لمنع أطراف غير مصرح لها أو مستخدمين آخرين من الوصول لمجلدات عروض أسعار مشاريعك أو إجراء تعديلات دون تصریح صريح صادر من توقيع حسابك الخاص.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">5</span>
                    حقوقك والتحكم ببياناتك
                  </h2>
                  <p>
                    تتمتع بحرية كاملة لمراجعة وهندسة وتعديل وحفظ وحذف كافة المجلدات وعروض الأسعار والملفات من جذور قواعد البيانات في أي وقت وبكبسة زر واحدة، وبدون أية شروط معقدة.
                  </p>
                </section>

                <section class="space-y-4 pt-4 border-t border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">6</span>
                    تواصل معنا
                  </h2>
                  <p>إذا كان لديك أي سؤال حول حماية البيانات، يسعدنا للغاية تواصلك:</p>
                  <p className="text-sm text-blue-400 font-bold font-sans">reefco.consult@gmail.com</p>
                </section>
              </div>
            </div>
          ) : (
            /* ENGLISH VERSION */
            <div className="space-y-10">
              <div className="border-b border-white/[0.06] pb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
                  <Shield size={12} />
                  <span>Last Updated: June 15, 2026</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Privacy Policy for XReef</h1>
                <p className="text-neutral-400 mt-3 text-base sm:text-lg">XReef is dedicated to protecting the absolute confidentiality and safety of your dynamic proposals and estimation folders.</p>
              </div>

              {/* Quick Outline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-none">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start text-left">
                  <Eye className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Absolute Transparency</h4>
                    <p className="text-neutral-400">Explicit disclosure of coordinates recorded, storage policies, and retrieval metrics.</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start text-left">
                  <Database className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Encrypted Infrastructure</h4>
                    <p className="text-neutral-400">All calculations, assets, and project hierarchies are hosted in partitioned vaults.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-neutral-300 text-sm sm:text-base leading-relaxed text-left">
                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">1</span>
                    Introduction & Framework
                  </h2>
                  <p>
                    Welcome to <strong>XReef</strong> Project and Quotation Ecosystem. We understand how critical calculations, rates, customer parameters, and workspace structures are to your business workflows. We commit fully to modern principles of data sovereignty and access isolation.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">2</span>
                    The Coordinates We Record
                  </h2>
                  <div className="space-y-2">
                    <p>To deliver flawless coordination and real-world calculation templates, we collect:</p>
                    <ul class="list-disc list-inside pl-4 space-y-1.5 text-neutral-400">
                      <li>Session access coordinates (display name, email, avatar URL) via Google Single Sign-In authentication.</li>
                      <li>Project organizational folder labels and pricing estimation layouts.</li>
                      <li>Browser agents, timing, and latency telemetry to maintain robust security protections.</li>
                    </ul>
                  </div>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">3</span>
                    Data Execution Purpose
                  </h2>
                  <p>
                    Operational procedures are conducted strictly to allow generating invoice tables, editing estimates, compiling tasks, maintaining database persistence across platforms, and providing direct technical assistance when computation failures happen.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">4</span>
                    Cloud Governance & Rules
                  </h2>
                  <p>
                    All active records are preserved on Google Cloud. We configure granular Firestore security rules to prevent foreign tenants or unauthenticated callers from reading your quotation metrics or altering database items without a validated cryptographic user token matching your account index.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">5</span>
                    Your Controls & Rights
                  </h2>
                  <p>
                    You retain continuous control over your workspace. You may modify values, rename items, and permanently delete folders or estimates directly within your dashboard with immediate, real-time database effect.
                  </p>
                </section>

                <section class="space-y-4 pt-4 border-t border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">6</span>
                    Reach Support
                  </h2>
                  <p>Have structural privacy concerns or account deletion inquiries? Contact our admin directly:</p>
                  <p className="text-sm text-blue-400 font-bold font-sans">reefco.consult@gmail.com</p>
                </section>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
