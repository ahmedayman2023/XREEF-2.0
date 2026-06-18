import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Printer, FileText, CheckCircle, Scale, Settings, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsPage() {
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
                  <FileText size={12} />
                  <span>آخر تحديث: 15 يونيو 2026</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">الشروط والأحكام لمنصة XReef</h1>
                <p className="text-neutral-400 mt-3 text-base sm:text-lg">اتفاقية الخدمة المنظمة لاستخدام نظام صياغة وحفظ عروض الأسعار وإدارة مسارات المشاريع.</p>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-none">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                  <CheckCircle className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">الموافقة الكاملة</h4>
                    <p className="text-neutral-400">بدخولك للمنصة، فإنك توافق تماماً وبلا استثناء على بنود تقديم الخدمة والالتزامات المترتبة.</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                  <Scale className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">بيان الحسابات الرياضية</h4>
                    <p className="text-neutral-400">تقع مسؤوليات مراجعة تسعير عروض المشروعات الحسابية والضريبية على منشئها الأول.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-neutral-300 text-sm sm:text-base leading-relaxed">
                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">1</span>
                    الموافقة وشروط التعاقد
                  </h2>
                  <p>
                    يمثل ولوجك أو تفاعلك أو حفظك للملفات عبر منصة <strong>XReef</strong> ("المنصة" أو "نحن") قبولاً تاماً ومطلقاً لبنود هذه الوثيقة وشروط السلامة التقنية المذكورة. في حال عدم موافقتك، يرجى حفظ ملفاتك ومغادرة المنصة فوراً.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">2</span>
                    توصيف الخدمات والقدرة السحابية
                  </h2>
                  <p>
                    تقدم XReef نظاماً إدارياً متقدماً يستهدف تبسيط تنظيم عروض الأسعار والتقديرات المالية، وتتبع هياكل المشاريع عبر مجلدات سحابية آمنة. نحتفظ بكامل الصلاحية لترقية أو تنقيح أو تعديل أو إيقاف أي ميزة من ميزات المنصة الإعمارية أو الحسابية في أي وقت لضمان الصالح العام للمجال.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">3</span>
                    الالتزامات التشغيلية والأسعار
                  </h2>
                  <div className="space-y-2">
                    <p>أنت كـ مستخدم للمنصة تقر وتلتزم بالقوانين التالية:</p>
                    <ul class="list-disc list-inside pr-4 space-y-1.5 text-neutral-400">
                      <li>تتحمل المسؤولية القانونية الكاملة عن صحة ودقة حسابات التسعير، وهوامش الأرباح والمبالغ الضريبية المحددة في عروض أسعار مشاريعك.</li>
                      <li>تعتبر الحسابات تقديرية لدعم عمليات الإدارة وتخطيط المشروعات، ولا تحل محل استشارات المحاسبة القانونية المعتمدة.</li>
                    </ul>
                  </div>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">4</span>
                    حقوق المحتوى والترخيص الفكري
                  </h2>
                  <p>
                    تنحصر ملكية وتراخيص كافة البيانات، المعطيات الحسابية، وعروض أسعار المشاريع التي تضعها وتديرها بحسابك الشخصي؛ أنت فقط المالك الفكري والوحيد لها. بينما تعد واجهات XReef، وتجربة المستخدم، والواجهة الخلفية، وشيفرات الكود الملكية الفكرة والتقنية الحصرية للمنصة.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">5</span>
                    إخلاء المسؤولية وحدود الضمان
                  </h2>
                  <p>
                    يتم تقديم نظام XReef وأدواته السحابية ومصادقة عروض الأسعار <strong>"كما هي"</strong> ودون أية تعهدات أو ضمانات تشغيلية صريحة أو ضمنية ضد الانقطاعات الطارئة المحتملة في شبكات الاتصال أو سيرفرات الاستضافة السحابية. لا تتحمل المنصة أية خسائر مرتبطة بصفقات تجارية تعتمد على التقديرات الإدارية.
                  </p>
                </section>

                <section class="space-y-4 pt-4 border-t border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">6</span>
                    للاستفسارات والاتصال
                  </h2>
                  <p>يسر الدعم المالي والإداري للمنصة معالجة تساؤلاتكم عبر:</p>
                  <p className="text-sm text-blue-400 font-bold font-sans">reefco.consult@gmail.com</p>
                </section>
              </div>
            </div>
          ) : (
            /* ENGLISH VERSION */
            <div className="space-y-10">
              <div className="border-b border-white/[0.06] pb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
                  <FileText size={12} />
                  <span>Last Updated: June 15, 2026</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Terms of Service for XReef</h1>
                <p className="text-neutral-400 mt-3 text-base sm:text-lg">Terms of Service governing access, data validation, pricing and project folder coordination in XReef.</p>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-none">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start text-left">
                  <CheckCircle className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Contractual Accord</h4>
                    <p className="text-neutral-400">Accessing XReef forms a binding accord to comply with all terms and service guidelines.</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 items-start text-left">
                  <Scale className="text-blue-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Pricing Sovereignty</h4>
                    <p className="text-neutral-400">Accuracy of rate inputs, financial calculations and target markup margins resides with you.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-neutral-300 text-sm sm:text-base leading-relaxed text-left">
                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">1</span>
                    Aesthetic Agreement & Terms
                  </h2>
                  <p>
                    By interacting, saving metrics, or generating custom files inside <strong>XReef</strong> ("the Platform"), you consent definitively to abide by all specified operational limitations. If you disagree, please backup your entries and cease operations immediately.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">2</span>
                    The Scope of Service & Platform Limits
                  </h2>
                  <p>
                    XReef provides tools to manage proposals, structure pricing estimates, and organize projects via secure cloud interfaces. We reserve exclusive rights to optimize algorithms, adjust pricing schemas, or limit active user storage as system conditions demand.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">3</span>
                    User Responsibilities & Rate Inputs
                  </h2>
                  <div className="space-y-2">
                    <p>As an active user of the system, you represent that:</p>
                    <ul class="list-disc list-inside pl-4 space-y-1.5 text-neutral-400">
                      <li>You carry full accountability for checking calculated estimations, rates, and values before dispatching documents to customers.</li>
                      <li>Platform structures represent estimates for management operations and do not supersede qualified financial audits.</li>
                    </ul>
                  </div>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">4</span>
                    Sovereignty & Code Licenses
                  </h2>
                  <p>
                    All database parameters, custom calculation models, and project media items constructed under your user profile are strictly owned by you. Conversely, XReef layouts, templates, animations, logos, and system codes are the exclusive, protected intellectual property of XReef.
                  </p>
                </section>

                <section class="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">5</span>
                    As-Is Quality Disclaimer
                  </h2>
                  <p>
                    XReef is distributed on an <strong>"as is"</strong> basis without solid guarantees against transient networking latency or cloud host service downtimes. We reject liability for any indirect profit impact resulting from user quotation formatting.
                  </p>
                </section>

                <section class="space-y-4 pt-4 border-t border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-sans">6</span>
                    Help Desk Coordinates
                  </h2>
                  <p>Have compliance, data security, billing, or platform integration concerns? Reach us immediately at:</p>
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
