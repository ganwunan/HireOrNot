import React, { useState, useRef } from 'react';
import { 
  FlaskConical, 
  Lightbulb, 
  ClipboardList, 
  Gavel, 
  Plus, 
  HelpCircle, 
  LogOut,
  Bell,
  Settings,
  UploadCloud,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!company || !jd || !file) {
      setError('请填写公司名称、上传简历并粘贴职位详情。');
      return;
    }

    setError('');
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('company', company);
    formData.append('jd', jd);
    formData.append('resume', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '分析失败');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface text-on-surface font-body antialiased">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 z-50 bg-white flex flex-col p-6 border-r border-slate-100 shadow-[10px_0_30px_rgba(32,48,68,0.04)]">
        <div className="mb-10">
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">HireOrNot</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-500 mb-4 leading-tight">Get rejected here, not in real life.</p>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">在这里被拒绝，总比在现实中好。</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-orange-600 border-r-4 border-orange-500 bg-orange-50/50 font-semibold transition-transform duration-200 hover:translate-x-1">
            <FlaskConical size={20} />
            <span className="text-sm font-medium tracking-wide">实验室</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 transition-transform duration-200 hover:translate-x-1">
            <Lightbulb size={20} />
            <span className="text-sm font-medium tracking-wide">情报中心</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 transition-transform duration-200 hover:translate-x-1">
            <ClipboardList size={20} />
            <span className="text-sm font-medium tracking-wide">任务日志</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 transition-transform duration-200 hover:translate-x-1">
            <Gavel size={20} />
            <span className="text-sm font-medium tracking-wide">面试裁决</span>
          </a>
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setResult(null)}
            className="w-full bg-primary-container text-on-primary-container font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 mb-4 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>新分析</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 text-xs">
            <HelpCircle size={18} />
            <span>帮助中心</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 text-xs">
            <LogOut size={18} />
            <span>退出登录</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium text-sm">当前路径 /</span>
            <span className="text-slate-900 font-bold text-sm">实验室</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-slate-500">
              <Bell size={20} className="cursor-pointer hover:text-orange-500 transition-colors" />
              <Settings size={20} className="cursor-pointer hover:text-orange-500 transition-colors" />
            </div>
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-200">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 max-w-5xl mx-auto w-full">
          {!result ? (
            <>
              {/* Editorial Header */}
              <div className="mb-16">
                <h2 className="text-[3.5rem] font-bold text-on-surface leading-tight tracking-tight mb-4">
                  实验室 <span className="text-primary-container">配置阶段</span>
                </h2>
                <p className="text-xl text-on-surface-variant max-w-2xl font-medium">
                  准备好进入“热座”了吗？在这里，我们剥去糖衣，只留下最直接的真相。请在开始之前提供以下必要素材。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column: Inputs */}
                <div className="col-span-1 md:col-span-8 space-y-8">
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                      <AlertTriangle size={20} />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  {/* Step 1: Company */}
                  <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_10px_30px_rgba(32,48,68,0.06)]">
                    <div className="flex items-start gap-4 mb-8">
                      <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded flex items-center justify-center font-bold text-sm">01</span>
                      <div>
                        <h3 className="text-xl font-semibold mb-1">目标公司名称</h3>
                        <p className="text-sm text-on-surface-variant">我们将根据公司文化定制面试风格。</p>
                      </div>
                    </div>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-surface-container-low border-none focus:ring-0 px-4 py-4 rounded-lg text-lg font-medium placeholder:text-outline-variant/60 transition-all border-b-2 border-transparent focus:border-primary-container outline-none" 
                        placeholder="例如：字节跳动、腾讯、Google..." 
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-container group-focus-within:w-full transition-all duration-300"></div>
                    </div>
                  </section>

                  {/* Step 2: Resume */}
                  <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_10px_30px_rgba(32,48,68,0.06)] border-l-4 border-primary-container">
                    <div className="flex items-start gap-4 mb-8">
                      <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded flex items-center justify-center font-bold text-sm">02</span>
                      <div>
                        <h3 className="text-xl font-semibold mb-1">上传简历</h3>
                        <p className="text-sm text-on-surface-variant">支持 PDF 格式。这是我们分析你的主要依据。</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="text-primary-container w-10 h-10 mb-3" />
                        <p className="mb-2 text-sm font-semibold text-on-surface">
                          {file ? file.name : '点击或拖拽文件到此处'}
                        </p>
                        <p className="text-xs text-outline-variant">最大限制 10MB</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf" 
                        className="hidden" 
                      />
                    </div>
                  </section>

                  {/* Step 3: Job Description */}
                  <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_10px_30px_rgba(32,48,68,0.06)]">
                    <div className="flex items-start gap-4 mb-8">
                      <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded flex items-center justify-center font-bold text-sm">03</span>
                      <div>
                        <h3 className="text-xl font-semibold mb-1">粘贴职位详情</h3>
                        <p className="text-sm text-on-surface-variant">请将职位描述（Job Description）的文本粘贴在下方。</p>
                      </div>
                    </div>
                    <textarea 
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      className="w-full bg-surface-container-low border-none focus:ring-0 px-4 py-4 rounded-lg text-base leading-relaxed placeholder:text-outline-variant/60 transition-all border-b-2 border-transparent focus:border-primary-container outline-none resize-none" 
                      placeholder="粘贴 JD 全文..." 
                      rows={8}
                    ></textarea>
                  </section>

                  {/* Final CTA */}
                  <div className="pt-8 flex flex-col sm:flex-row items-center gap-6">
                    <button 
                      onClick={handleSubmit}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-br from-primary to-primary-container text-white px-10 py-5 rounded-lg font-bold text-lg shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="animate-spin" />
                          <span>正在深度解析...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter The Hot Seat / 开始深度面试</span>
                          <ArrowRight />
                        </>
                      )}
                    </button>
                    <p className="text-xs text-on-surface-variant italic">点击即表示你已准备好接受最严苛的审视。</p>
                  </div>
                </div>

                {/* Right Column: Editorial Sidebar */}
                <div className="col-span-1 md:col-span-4 space-y-8">
                  {/* Pro Tip Card */}
                  <div className="bg-surface-container p-8 rounded-xl border border-white">
                    <div className="flex items-center gap-2 mb-6">
                      <Lightbulb className="text-primary-container" size={20} />
                      <span className="font-bold text-sm uppercase tracking-widest text-primary">专业建议 / PRO TIP</span>
                    </div>
                    <h4 className="text-lg font-bold mb-4">如何获得最精准的反馈？</h4>
                    <ul className="space-y-4 text-sm text-on-surface-variant font-medium">
                      <li className="flex gap-3">
                        <span className="text-primary-container">•</span>
                        <span>简历中不要隐藏任何“水分”，我们的算法会像资深 HR 一样嗅到它们。</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary-container">•</span>
                        <span>JD 越详细，模拟面试的针对性就越强。</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary-container">•</span>
                        <span>保持心态开放。我们的目标不是安慰你，而是让你变得更强。</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Analysis Results View */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-12 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-on-surface mb-2">面试裁决报告</h2>
                  <p className="text-on-surface-variant">针对 {company} 职位的深度简历剖析</p>
                </div>
                <button 
                  onClick={() => setResult(null)}
                  className="text-primary font-bold hover:underline flex items-center gap-2"
                >
                  重新分析
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Score Card */}
                <div className="col-span-1 bg-surface-container-lowest p-8 rounded-xl shadow-sm border-t-4 border-primary-container flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-4">匹配度得分</p>
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary-container"
                        strokeDasharray={`${result.matchingScore}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-3xl font-black text-on-surface">{result.matchingScore}</div>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-2 font-medium">
                    {result.matchingScore >= 80 ? '高度匹配' : result.matchingScore >= 60 ? '勉强及格' : '差距较大'}
                  </p>
                </div>

                {/* Verdict Card */}
                <div className="col-span-1 md:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-4">最终裁决 / VERDICT</p>
                  <p className="text-xl font-medium leading-relaxed text-on-surface">
                    "{result.overallVerdict}"
                  </p>
                </div>

                {/* Strengths */}
                <div className="col-span-1 md:col-span-1 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="text-green-500" />
                    <h3 className="font-bold text-lg">核心优势</h3>
                  </div>
                  <ul className="space-y-4">
                    {result.strengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-on-surface-variant">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="col-span-1 md:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm border-l-4 border-red-500">
                  <div className="flex items-center gap-2 mb-6">
                    <XCircle className="text-red-500" />
                    <h3 className="font-bold text-lg">致命弱点 & 风险</h3>
                  </div>
                  <ul className="space-y-4">
                    {result.weaknesses?.map((weakness: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-on-surface-variant">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interview Questions */}
                <div className="col-span-1 md:col-span-3 bg-on-surface text-white p-10 rounded-xl shadow-lg mt-4">
                  <p className="text-primary-fixed font-bold tracking-widest text-xs mb-4 uppercase">PREPARE FOR THE WORST</p>
                  <h3 className="text-2xl font-bold mb-8">高压面试预测题</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.suggestedInterviewQuestions?.map((q: string, idx: number) => (
                      <div key={idx} className="bg-white/10 p-6 rounded-lg border border-white/10">
                        <div className="text-primary-container font-black text-2xl mb-4 opacity-50">Q{idx + 1}</div>
                        <p className="text-sm leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 flex justify-end">
                    <button className="bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-400 transition-colors">
                      进入模拟对练 <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
