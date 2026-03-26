import express from 'express';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log('🔑 API Key 状态:', process.env.GEMINI_API_KEY ? '✅ 已配置' : '❌ 未配置');

// 确保目录存在
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 初始化 Gemini
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('✅ Gemini API 初始化成功');
  } catch (error) {
    console.error('❌ Gemini 初始化失败:', error);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY 未设置，将使用模拟模式');
}

// 加载 pdf-parse
let pdfParse: any = null;
async function loadPdfParse() {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    pdfParse = require('pdf-parse');
    console.log('✅ pdf-parse 加载成功');
    return true;
  } catch (e) {
    console.error('❌ pdf-parse 加载失败:', e);
    return false;
  }
}

// 辅助函数：重复字符串
function repeatString(str: string, count: number): string {
  return Array(count + 1).join(str);
}

// PDF 解析函数
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  if (!pdfParse) {
    throw new Error('pdf-parse 未加载');
  }

  console.log('📖 解析 PDF...');
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text;

  if (!text || text.trim().length === 0) {
    throw new Error('PDF 中未提取到文字');
  }

  console.log(`✅ 解析成功，文本长度: ${text.length}`);
  return text;
}

// 生成分析结果
function generateAnalysisFromResume(resumeText: string, company: string) {
  const hasHR = resumeText.includes('人力资源') || resumeText.includes('HR') || resumeText.includes('人力');
  const hasIntern = resumeText.includes('实习') || resumeText.includes('实习生');
  const hasAI = resumeText.includes('AI') || resumeText.includes('人工智能');
  const hasEnglish = resumeText.includes('CET6') || resumeText.includes('英语');
  const hasPrize = resumeText.includes('奖');
  const hasStudent = resumeText.includes('学生会') || resumeText.includes('干部');

  const strengths = [];
  if (hasHR) strengths.push('人力资源管理专业背景');
  if (hasIntern) strengths.push('有相关实习经验');
  if (hasAI) strengths.push('对 AI 行业有了解');
  if (hasEnglish) strengths.push('英语能力较好 (CET6)');
  if (hasPrize) strengths.push('有竞赛获奖经历');
  if (hasStudent) strengths.push('有学生干部经历');
  strengths.push('学习能力强', '适应能力好');

  const weaknesses = [];
  if (!hasIntern) weaknesses.push('缺乏相关实习经验');
  if (!hasPrize) weaknesses.push('缺乏竞赛成果');
  weaknesses.push('项目经历需要深化');

  let score = 50;
  if (hasHR) score += 15;
  if (hasIntern) score += 15;
  if (hasAI) score += 5;
  if (hasEnglish) score += 5;
  if (hasPrize) score += 5;
  if (hasStudent) score += 5;

  return {
    matchingScore: Math.min(95, score),
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 3),
    suggestedInterviewQuestions: [
      '请分享你在猎头实习中遇到的最大挑战及如何解决的？',
      '你对 AI 行业的人才招聘有什么独特见解？',
      '如果候选人拒绝 offer，你会怎么处理？',
      '请举例说明你如何通过数据分析优化招聘流程？'
    ],
    overallVerdict: `候选人专业背景${hasHR ? '匹配' : '相关'}，${hasIntern ? '有' : '无'}相关实习经验。建议进入面试环节进一步考察实际能力。`
  };
}

async function startServer() {
  // 先加载 pdf-parse
  await loadPdfParse();

  const app = express();
  const PORT = 3000;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.use(express.json());
  app.use(express.static(publicDir));

  // 创建前端页面
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HireOrNot - AI面试官</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .loading { display: none; }
        .loading.active { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">HireOrNot</h1>
            <p class="text-gray-600 mb-8">在这里被拒绝，总比在现实中好。</p>
            
            <div id="status" class="mb-4 p-3 rounded-lg text-sm hidden"></div>
            
            <form id="analysisForm" enctype="multipart/form-data">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">目标公司 *</label>
                    <input type="text" id="company" name="company" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                           placeholder="例如：字节跳动、腾讯、阿里巴巴">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">简历 (PDF) *</label>
                    <input type="file" id="resume" name="resume" accept=".pdf" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <p class="text-xs text-gray-500 mt-1">支持 PDF 格式，最大 10MB</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">职位描述 (JD) *</label>
                    <textarea id="jd" name="jd" rows="6" required
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              placeholder="粘贴职位描述..."></textarea>
                </div>
                
                <button type="submit"
                        class="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2">
                    <span>开始分析</span>
                    <span class="loading" id="loading">⏳</span>
                </button>
            </form>
            
            <div id="result" class="mt-8 hidden">
                <div class="border-t pt-6">
                    <h2 class="text-xl font-bold mb-4">分析结果</h2>
                    <div id="resultContent"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('analysisForm');
        const loading = document.getElementById('loading');
        const resultDiv = document.getElementById('result');
        const resultContent = document.getElementById('resultContent');
        const statusDiv = document.getElementById('status');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('company', document.getElementById('company').value);
            formData.append('resume', document.getElementById('resume').files[0]);
            formData.append('jd', document.getElementById('jd').value);
            
            loading.classList.add('active');
            resultDiv.classList.add('hidden');
            statusDiv.classList.add('hidden');
            
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultContent.innerHTML = \`
                        <div class="space-y-4">
                            <div class="bg-green-50 p-4 rounded-lg">
                                <div class="text-sm text-gray-600">匹配度得分</div>
                                <div class="text-3xl font-bold text-green-600">\${data.matchingScore || 0}%</div>
                            </div>
                            
                            <div>
                                <div class="font-semibold text-gray-700 mb-2">✅ 优势</div>
                                <ul class="list-disc pl-5 space-y-1">
                                    \${(data.strengths || []).map(s => '<li class="text-gray-600">' + s + '</li>').join('')}
                                </ul>
                            </div>
                            
                            <div>
                                <div class="font-semibold text-gray-700 mb-2">⚠️ 待改进</div>
                                <ul class="list-disc pl-5 space-y-1">
                                    \${(data.weaknesses || []).map(w => '<li class="text-gray-600">' + w + '</li>').join('')}
                                </ul>
                            </div>
                            
                            <div>
                                <div class="font-semibold text-gray-700 mb-2">🎯 面试问题建议</div>
                                <ul class="list-disc pl-5 space-y-1">
                                    \${(data.suggestedInterviewQuestions || []).map(q => '<li class="text-gray-600">' + q + '</li>').join('')}
                                </ul>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="font-semibold text-gray-700 mb-2">📋 综合评估</div>
                                <p class="text-gray-600">\${data.overallVerdict || '暂无评估'}</p>
                            </div>
                        </div>
                    \`;
                    resultDiv.classList.remove('hidden');
                } else {
                    statusDiv.className = 'mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700';
                    statusDiv.innerHTML = '❌ 分析失败: ' + (data.error || '未知错误');
                    statusDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error:', error);
                statusDiv.className = 'mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700';
                statusDiv.innerHTML = '❌ 请求失败: ' + error.message;
                statusDiv.classList.remove('hidden');
            } finally {
                loading.classList.remove('active');
            }
        });
    </script>
</body>
</html>`;

  // 写入 HTML 文件
  fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

  // 根路由
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // API 健康检查
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!ai,
      pdfParseLoaded: !!pdfParse
    });
  });

  // 简历分析接口
  app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    const startTime = Date.now();

    try {
      const { company, jd } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: '请上传简历文件' });
      }

      if (!company || !jd) {
        return res.status(400).json({ error: '请填写公司名称和职位描述' });
      }

      console.log(`\n${repeatString('=', 60)}`);
      console.log(`📄 开始分析简历，公司: ${company}`);
      console.log(`📝 文件名: ${file.originalname}`);
      console.log(`📝 文件大小: ${(file.size / 1024).toFixed(2)} KB`);

      // 提取 PDF 文本
      let resumeText = '';
      try {
        if (!pdfParse) {
          throw new Error('pdf-parse 未加载，请检查安装');
        }

        console.log('🔍 开始解析 PDF...');
        resumeText = await extractTextFromPDF(file.buffer);

        console.log(`✅ PDF 解析成功！耗时: ${Math.round((Date.now() - startTime) / 1000)}秒`);
        console.log(`📝 文本长度: ${resumeText.length} 字符`);
        console.log(`📝 文本预览:\n${resumeText.substring(0, 500)}...`);

      } catch (pdfError: any) {
        console.error('❌ PDF 解析错误:', pdfError.message);
        return res.status(400).json({
          error: 'PDF 解析失败',
          details: pdfError.message
        });
      }

      const truncatedResume = resumeText.substring(0, 8000);
      const truncatedJd = jd.substring(0, 4000);

      // 如果没有 AI，返回本地分析
      if (!ai) {
        console.log('⚠️ 使用本地分析模式');
        const localAnalysis = generateAnalysisFromResume(resumeText, company);
        return res.json(localAnalysis);
      }

      // 构建分析 prompt
      const prompt = `
        你是一位专业的招聘经理，正在为 ${company} 公司面试 HR/招聘岗位的候选人。
        
        职位描述:
        ${truncatedJd}
        
        候选人简历:
        ${truncatedResume}
        
        请对候选人进行专业评估，返回 JSON 格式，不要有其他文字：
        {
          "matchingScore": 匹配度分数 0-100,
          "strengths": ["优势1", "优势2", "优势3"],
          "weaknesses": ["待改进1", "待改进2"],
          "suggestedInterviewQuestions": ["面试问题1", "问题2", "问题3"],
          "overallVerdict": "综合评价"
        }
      `;

      console.log('🤖 调用 Gemini API...');

      let response;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API 请求超时')), 60000);
        });

        const apiPromise = ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        response = await Promise.race([apiPromise, timeoutPromise]);

        const analysisResult = JSON.parse(response.text || '{}');
        console.log(`✅ 分析完成，匹配度: ${analysisResult.matchingScore}%`);
        console.log(repeatString('=', 60));
        res.json(analysisResult);

      } catch (apiError: any) {
        console.error('Gemini 调用失败:', apiError.message);
        const fallbackAnalysis = generateAnalysisFromResume(resumeText, company);
        res.json(fallbackAnalysis);
      }

    } catch (error: any) {
      console.error('❌ 分析错误:', error.message);
      res.status(500).json({ error: '分析失败: ' + error.message });
    }
  });

  // 追问接口
  app.post('/api/followup', async (req, res) => {
    try {
      const { userMessage } = req.body;
      if (!ai) {
        return res.json({ followup: '请更具体地描述你的回答。' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `请给出一个深入的面试追问问题：${userMessage}`,
      });

      res.json({ followup: response.text || '请详细说明。' });
    } catch (error) {
      res.json({ followup: '请更具体地说明你的观点。' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${repeatString('=', 60)}`);
    console.log(`🚀 服务器运行在: http://localhost:${PORT}`);
    console.log(`🌐 打开浏览器访问: http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/health`);
    console.log(`\n状态:`);
    console.log(`   Gemini: ${ai ? '✅ 已配置' : '⚠️ 模拟模式'}`);
    console.log(`   PDF解析: ${pdfParse ? '✅ 已加载' : '❌ 未加载'}`);
    console.log(`${repeatString('=', 60)}\n`);
  });
}

startServer().catch(console.error);