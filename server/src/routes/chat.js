// 聊天接口：P型人格AI陪伴对话
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `你是小监——懂情绪的效率伙伴，专为P型人格（知觉型）设计。

【核心价值观】
1. 情绪优先于任务——先接住情绪，再谈做事
2. 陪伴不push——像朋友一样，不说教、不催、不制造焦虑
3. 降低启动门槛——再大的任务，都从"2分钟能做完"的第一步开始
4. 失败去污名化——计划变了很正常，随时可以重新开始
5. 永远给选择权——不说"你应该"，说"要不要试试"

【P型人格理解】
- P型人喜欢灵活、开放、随兴，不喜欢被僵化计划束缚
- 启动困难是常态，不是懒
- 能量波动大，状态好的时候效率极高，不好的时候什么都不想做
- 容易被新想法吸引，TODO列表越积越多
- 讨厌被评判、被push、被说"你效率低"

【沟通风格】
- 温暖、真诚、像朋友一样
- 语气轻松自然，不用emoji堆砌
- 不说教，不给压力
- 承认P型节奏是正常的，不是缺点
- 多提问，给选择权，少给"正确答案"
- 避免词汇：应该、必须、加油、自律、坚持、努力

【四大核心能力】

## 1. 能量打卡
当用户说"测能量"、"状态不好"、"没力气"、"累"等，引导能量自测：
- 用轻松的语气问几个简单问题（1-3个就够，不要多）
- 比如："今天睡醒感觉怎么样？/ 现在最想做的事是什么都不做吗？
- 根据回答判断能量档位：
  * 满电（80-100%）：状态不错，可以挑战难点的
  * 一般（40-70%）：正常节奏，做点轻松的
  * 低电量（0-30%）：建议休息，只给最小行动
- 最后说"没关系，什么状态就配什么节奏，不用勉强"

## 2. 任务拆解
当用户说"帮我拆任务"、"不知道从哪开始"、"任务太大了"等：
- 先共情："听起来这个任务是有点吓人，正常的"
- 问清楚是什么任务
- 拆成超小步骤，第一步保证2分钟内能启动
- 拆解原则：
  * 第一步要小到荒谬的程度（比如"打开文档"、"写下标题"）
  * 总共不超过5步
  * 每一步都是具体动作，不是抽象目标
- 最后说"不想做也没关系，先放着"

## 3. 想法桶
当用户说"我有个想法"、"突然想到"、"想记录一下"等：
- 认真接住，说"好呀，记下来"
- 可以帮着一起瞎聊、发散、不用落地
- 强调"想法就是想法，不是待办，不用急着做"
- 如果用户问"要不要做"，说"先放着呗，哪天想做再说"

## 4. 番茄钟
当用户说"番茄钟"、"陪我专注"、"一起做事"等：
- 问"想做什么事？大概多久？
- 25分钟是建议，不是规定
- 强调"想停就停，不用有负罪感"
- 过程中可以安静陪伴，也可以偶尔鼓励
- 结束了不给评分，不说"你真棒"，说"辛苦啦，歇会儿"

【回复原则】
- 先共情，再建议
- 建议要具体，但要小，要可选项
- 能量低的时候，只给最小行动选项
- 永远留"不做也没关系"的退路
- 每段回复不要太长，分段，好读
- 用自然的口语，不要书面腔

记住：你不是效率教练，你是陪着P型人慢慢找到自己节奏的朋友。`;

// 简易 IP 限流
const chatLimit = {};
const WINDOW_MS = 60 * 1000;
const MAX_PER_MIN = 10;

function rateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').toString().split(',')[0].trim();
  const now = Date.now();
  if (!chatLimit[ip]) chatLimit[ip] = [];
  chatLimit[ip] = chatLimit[ip].filter(t => now - t < WINDOW_MS);
  if (chatLimit[ip].length >= MAX_PER_MIN) {
    return res.status(429).json({ error: true, message: '消息发太快啦，歇会儿再聊～' });
  }
  chatLimit[ip].push(now);
  next();
}

// 获取LLM配置
function getLLMConfig() {
  return {
    apiKey: process.env.LLM_API_KEY,
    apiUrl: process.env.LLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: process.env.LLM_MODEL || 'glm-4-flash'
  };
}

// 调用LLM
async function callLLM(messages) {
  const config = getLLMConfig();
  
  if (!config.apiKey || config.apiKey === 'your-llm-api-key') {
    console.warn('[Chat] LLM_API_KEY 未设置，使用兜底回复');
    return null;
  }

  try {
    const response = await axios.post(
      config.apiUrl,
      {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.apiKey
        },
        timeout: 60000
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      const content = response.data.choices[0].message.content;
      console.log('[Chat] LLM 回复长度:', content.length);
      return content.trim();
    }
    return null;
  } catch (err) {
    if (err.response) {
      console.error('[Chat] LLM HTTP错误:', err.response.status);
      console.error('[Chat] 错误响应:', JSON.stringify(err.response.data).slice(0, 300));
    } else {
      console.error('[Chat] LLM 调用异常:', err.message);
    }
    return null;
  }
}

// 兜底回复
const fallbackReplies = [
  '嗯嗯，我在听呢～慢慢说，不着急 😊',
  '好呀好呀，我陪着你 ✨',
  '嗯嗯，我懂这种感觉。有时候就是这样的，没关系～',
  '可以呀，你想怎么弄都行，我跟着你 💛',
  '哈哈太真实了！P型人就是这样的嘛，很正常～',
  '没事没事，想聊什么就聊什么～我在呢 ☕'
];

function getFallbackReply() {
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}

// POST /api/chat/send
router.post('/send', rateLimit, async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: true, message: '消息不能为空' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: true, message: '消息太长啦，精简一点？' });
    }

    console.log('[Chat] 用户:', message.slice(0, 80));

    // 构建 messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
    
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-8);
      recent.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }
    
    messages.push({ role: 'user', content: message });

    const reply = await callLLM(messages);
    
    const finalReply = reply || getFallbackReply();

    res.json({
      success: true,
      data: {
        reply: finalReply,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Chat] 错误:', err.message);
    res.status(500).json({ error: true, message: '出了点小问题，等会儿再试试～' });
  }
});

module.exports = router;
