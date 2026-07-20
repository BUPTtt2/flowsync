import json

with open('nengliang-V0.json', 'r', encoding='utf-8') as f:
    base = json.load(f)

node_id_counter = 2000
def nid(prefix):
    global node_id_counter
    node_id_counter += 1
    return f"{prefix}{node_id_counter}"

TASKS_POOL = """今日任务池：
- 完成产品方案初稿（高优先级，2h，创造性）
- 更新项目文档（中优先级，1h，机械）
- 回复客户邮件（中优先级，0.5h，沟通）
- 整理会议笔记（低优先级，0.5h，机械）
- 代码审查（中优先级，1.5h，专注）"""

P_PERSONA = """你是FlowSync助手，专门服务于P型人格（知觉型）创意工作者。

核心人格设定：
1. P型人喜欢灵活、开放、随兴，不喜欢被僵化计划束缚
2. 启动困难是常态，不是懒
3. 能量波动大，状态好的时候效率极高，不好的时候什么都不想做
4. 容易被新想法吸引，TODO 列表越积越多
5. 讨厌被评判、被push、被说"你效率低"

你的工作原则：
- 共情优先，不评判，不制造焦虑
- 承认P型节奏不同于J型，慢一点没关系
- 能量低的时候只给最小任务，不给压力
- 用温暖、支持的语气，像朋友一样
- 永远给选择权，不说"你应该"
- 失败去污名化：计划变了很正常，随时可以重新开始"""

def make_start(x, y):
    return {
        "id": nid("START"), "type": "agentStart",
        "dimensions": {"width": 248, "height": 141},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": "开始",
        "outputs": [{
            "name": "systemFields", "fields": [
                {"name": "USER_INPUT", "displayName": "USER_INPUT", "type": "String", "required": True,
                 "description": "本次对话输入内容", "value": "", "sourceType": "ref"},
                {"name": "FILES_INPUT", "displayName": "FILES_INPUT", "type": "Array<String>", "required": False,
                 "description": "本次对话上传的文件地址", "value": "", "sourceType": "ref"},
                {"name": "EVENT_INPUT", "displayName": "EVENT_INPUT", "type": "Object", "required": False,
                 "description": "本次对话的事件内容", "value": "", "sourceType": "ref",
                 "nextOutputParamInfo": [
                     {"name": "EventName", "type": "String", "description": "", "required": False},
                     {"name": "EventPayload", "type": "Object", "description": "", "required": False}
                 ]}
            ]
        }, {"name": "userFields", "fields": []}],
        "description": "工作流开始的节点"
    }

def make_end(x, y):
    return {
        "id": nid("END"), "type": "agentEnd",
        "dimensions": {"width": 248, "height": 79},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": "结束",
        "outputs": [{
            "name": "userFields", "fields": [
                {"name": "output", "type": "String", "required": True, "description": "", "sourceType": "input"}
            ]
        }, {"name": "combinationConfig", "fields": [
            {"name": "stepInfo", "type": "String", "required": True,
             "description": "思考状态", "value": "", "sourceType": "input",
             "unEditName": True, "deleteDisabled": True, "typeDisabled": True},
            {"name": "outputId", "displayName": "streamingTextId", "type": "String", "required": False,
             "description": "输出流id", "value": "", "sourceType": "input",
             "unEditName": True, "deleteDisabled": True, "typeDisabled": True, "maxlength": 50}
        ]}],
        "description": "工作流的结束节点", "configs": {}
    }

def make_intent(x, y):
    branches = [
        {"branchId": "energy_check", "handleId": "energy_check", "catalog": "能量打卡"},
        {"branchId": "task_split", "handleId": "task_split", "catalog": "任务拆解"},
        {"branchId": "focus_now", "handleId": "focus_now", "catalog": "专注模式"},
        {"branchId": "task_list", "handleId": "task_list", "catalog": "任务列表"},
        {"branchId": "mood_rec", "handleId": "mood_rec", "catalog": "情绪推荐"},
        {"branchId": "complete_task", "handleId": "complete_task", "catalog": "完成任务"},
        {"branchId": "someday", "handleId": "someday", "catalog": "想法桶"},
        {"branchId": "reset_today", "handleId": "reset_today", "catalog": "重置今日"},
        {"branchId": "default", "handleId": "default", "catalog": "默认分类"}
    ]
    return {
        "id": nid("INTENT"), "type": "jiuwen.IntentDetectionComponent",
        "dimensions": {"width": 248, "height": 420},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": "意图分类",
        "description": "模型通过理解用户的自然语言，执行对应的分支流程",
        "inputs": [{"name": "preDefinedFields", "fields": [
            {"name": "query", "type": "String", "required": True, "description": "",
             "sourceType": "input", "deleteDisabled": True, "nameDisabled": True,
             "typeDisabled": True, "unEditName": True}
        ]}],
        "outputs": [{"name": "preDefinedFields", "fields": [
            {"name": "classificationId", "type": "String", "required": True, "description": ""},
            {"name": "reason", "type": "String", "required": True, "description": ""}
        ]}],
        "configs": {
            "modelConfigs": {"llmContextLength": "64k", "llmOwner": 1},
            "prompt": P_PERSONA + """
你的工作是意图分类。请将用户输入分类到以下意图之一：

- energy_check：能量打卡、心情如何、今天几格电、状态怎么样、我今天状态、我累不累
- task_split：拆任务、拖延了、不想做、卡住了、帮我拆解、SOS、启动困难、不想动
- focus_now：我要专注、只做一件事、开始工作、进入专注模式、单一焦点、干活
- task_list：今天干什么、我的任务、待办、有什么安排、任务列表、今天做啥
- mood_rec：推荐任务、我现在很累该做什么、适合做什么、根据心情推荐、状态不好
- complete_task：完成了、做完了、打卡、搞定了、交差了、今天收工
- someday：记个想法、以后做、someday、灵感、先放着、想法桶
- reset_today：重新开始、今天重来、reset、我想重置、全部重来
- default：打招呼、闲聊、其他无关内容

只返回 classificationId，不要解释。""",
            "branches": branches,
            "context": {"dialogueHistorySwitch": True, "dialogueHistoryType": "self"}
        }
    }

def make_branch(x, y, num_cases):
    branches = []
    for i in range(num_cases):
        branches.append({
            "id": f"SwitchCase{i+1}", "condition": "==",
            "expression": [{"leftVar": {"value": "", "fieldType": "String"},
                           "condition": "==",
                           "rightVar": {"sourceType": "input", "value": "", "fieldType": "String"}}]
        })
    branches.append({"id": "default"})
    return {
        "id": nid("BRANCH"), "type": "AgentBranch",
        "dimensions": {"width": 248, "height": 149 + num_cases * 20},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": "选择器",
        "description": "连接多个下游分支",
        "branches": branches
    }

def make_questioner(x, y, label, question, option_type="reply_based_on_options", options=None):
    branches = []
    if options:
        for i, opt in enumerate(options):
            branches.append({"branchId": f"branch_{i+1}", "catalog": opt["label"]})
    branches.append({"branchId": "default", "catalog": "默认类别"})
    return {
        "id": nid("Q"), "type": "jiuwen.QuestionerComponent",
        "dimensions": {"width": 248, "height": 300 if options else 221},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": label, "description": "直接问答、参数提取&追问",
        "inputs": [
            {"name": "userFields", "fields": [
                {"name": "", "type": "String", "required": False, "description": "", "value": "", "sourceType": "input"}
            ]},
            {"name": "preDefinedFields", "fields": []}
        ],
        "outputs": [{"name": "preDefinedFields", "fields": [
            {"name": "userResponse", "displayName": "USER_RESPONSE", "type": "String",
             "required": True, "description": "用户本轮回答内容"}
        ]}],
        "configs": {
            "modelConfigs": {"llmName": "", "llmContextLength": 4096, "llmOwner": "",
                            "hyperParameters": {"temperature": 0.2, "topP": 0.9}},
            "extraInstruction": "",
            "questionContent": question,
            "isExtractedFields": False, "extractedFields": [],
            "maxResponse": 5, "responseType": "reply_directly",
            "optionType": option_type, "branches": branches,
            "context": {"dialogueHistorySwitch": False, "dialogueHistoryType": "self"},
            "maxTimeOut": 30, "timeOutWarnsMessage": ""
        }
    }

def make_llm(x, y, label, system_prompt, user_prompt):
    return {
        "id": nid("LLM"), "type": "AgentLargeModel",
        "dimensions": {"width": 248, "height": 320},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": label, "description": "调用大模型",
        "inputs": [{"name": "userFields", "fields": [
            {"name": "", "type": "String", "required": True, "description": "", "sourceType": "input"}
        ]}],
        "outputs": [{"name": "userFields", "fields": [
            {"name": "output", "type": "String", "required": True, "description": ""}
        ]}],
        "configs": {
            "deployMode": "workflow",
            "model": {"llmContextLength": "64k", "llmOwner": 1, "hyperParameters": []},
            "templateContent": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "responseFormat": {"type": "markdown"},
            "skillList": [],
            "context": {"dialogueHistorySwitch": True, "dialogueHistoryType": "self"}
        }
    }

def make_output(x, y, label="输出"):
    return {
        "id": nid("OUT"), "type": "xiaoyi.outputComponent",
        "dimensions": {"width": 248, "height": 145},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": label, "description": "",
        "inputs": [],
        "outputs": [
            {"name": "userFields", "fields": [
                {"name": "output", "type": "String", "required": True, "description": "",
                 "value": "", "sourceType": "input"}
            ]},
            {"name": "combinationConfig", "fields": []}
        ],
        "configs": {
            "responseTemplate": "", "isStreamOut": False, "isStreamingText": False,
            "outputMode": "OutputStream",
            "context": {"dialogueHistorySwitch": True}
        }
    }

def make_memory(x, y, label="长期记忆", query=""):
    return {
        "id": nid("MEM"), "type": "xiaoyi.AgentMemoryComponent",
        "dimensions": {"width": 248, "height": 147},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": label,
        "description": "调用长期记忆，获取用户个性化信息",
        "inputs": [{"name": "preDefinedFields", "fields": [
            {"name": "query", "type": "String", "required": True,
             "description": "输入需要从长期记忆中匹配的关键信息",
             "value": query, "sourceType": "input"}
        ]}],
        "outputs": [{"name": "preDefinedFields", "fields": [
            {"name": "memory", "description": "memory", "type": "Array<Object>",
             "required": False, "enabled": False,
             "nextOutputParamInfo": [
                 {"name": "memoryContent", "description": "", "type": "String", "required": False, "enabled": False},
                 {"name": "createTime", "description": "", "type": "String", "required": False, "enabled": False}
             ]}
        ]}],
        "configs": {}
    }

def make_textproc(x, y, label="文本处理", template=""):
    return {
        "id": nid("TEXT"), "type": "jiuwen.TextProcessingComponent",
        "dimensions": {"width": 248, "height": 147},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y}, "events": {},
        "label": label, "description": "字符串拼接、分隔",
        "inputs": [{"name": "userFields", "fields": [
            {"name": "", "type": "String", "required": True, "description": "", "value": "", "sourceType": "input"}
        ]}],
        "outputs": [{"name": "preDefinedFields", "fields": [
            {"name": "output", "type": "String", "required": True, "description": ""}
        ]}],
        "configs": {
            "functionality": "concat", "listJoinString": "\\n",
            "concatTemplate": template,
            "splitStringList": [], "customSeparatorList": [], "customConnectionList": []
        }
    }

# ============== 构建节点 ==============
COL = [30, 340, 650, 960, 1270, 1580, 1890, 2200]

start = make_start(COL[0], 600)
intent = make_intent(COL[1], 520)
branch = make_branch(COL[2], 550, 8)

# 9 个分支，从上到下排列
branch_data = []
y_positions = [40, 220, 400, 580, 760, 940, 1120, 1300, 1480]

# 分支1: 能量打卡
b1_q = make_questioner(
    COL[3], y_positions[0],
    "能量打卡提问",
    "今天感觉几格电？我会根据你的状态重排今天的任务。\n\n【满电】硬骨头先上\n【不错】中等难度合适\n【一般】先做机械活热身\n【偏累】只做1件5分钟小事",
    options=[{"label": "满电"}, {"label": "不错"}, {"label": "一般"}, {"label": "偏累"}]
)
b1_llm = make_llm(
    COL[4], y_positions[0],
    "AI重排任务",
    P_PERSONA + "\n\n" + TASKS_POOL,
    "用户选择的能量等级：{{用户选择}}\n\n请根据能量等级重新排序今日任务，并给出共情式回复。\n\n规则：\n- 满电(95分)：把高难度、创造性任务排在前面，排满一天\n- 不错(70分)：1个高难度 + 2个中等难度\n- 一般(45分)：把机械、低认知负荷任务排在前面，创意任务放后面\n- 偏累(20分)：只保留1个5分钟内能完成的最小任务，其余全部后移到明天\n\n输出格式：\n第一行：一句共情反馈（承认P型状态，温暖不评判）\n\n**今日安排（重排后）**\n1. [优先级] 任务名 · 预计时长 · 为什么排这里\n2. ...\n\n**小建议**：\n一句柔性建议"
)
b1_out = make_output(COL[5], y_positions[0], "能量打卡输出")

# 分支2: 任务拆解
b2_q = make_questioner(
    COL[3], y_positions[1],
    "任务名提问",
    "哪个任务卡住了？告诉我任务名字，我帮你拆成5分钟能启动的小步骤。",
    option_type="reply_directly"
)
b2_llm = make_llm(
    COL[4], y_positions[1],
    "AI拆解任务",
    P_PERSONA + """
你是任务拆解助手。把大任务拆到最小可执行，小到不可能失败。
第一步必须是最无压力的动作（打开工具、看一眼、新建文件）。
允许做了第一步就暂停，不要求全做完。""",
    "用户说TA拖延了这个任务：{{任务名}}\n\n请拆解成3个'5分钟启动版'步骤：\n1. 最小启动动作（1分钟内，零压力）\n2. 推进一小步（3分钟）\n3. 可以暂停的节点（1分钟收尾）\n\n输出格式：\n先一句共情开场\n\n**5分钟启动版**\n1. 步骤名 · X分钟\n2. 步骤名 · X分钟\n3. 步骤名 · X分钟\n\n最后一句鼓励：做完第一步就算赢，随时可以停下。"
)
b2_out = make_output(COL[5], y_positions[1], "拆解输出")

# 分支3: 专注模式
b3_mem = make_memory(COL[3], y_positions[2], "读取当前任务", "当前最高优先级任务")
b3_llm = make_llm(
    COL[4], y_positions[2],
    "单一焦点",
    P_PERSONA + "用户进入了单一焦点模式，其他所有任务都藏起来。只聚焦一件事。",
    "请输出专注模式引导：\n\n**单一焦点模式**\n\n其他任务我都藏起来了。现在只做这一件事：\n\n👉 **完成产品方案初稿**\n   预计 2 小时 · 高优先级\n\n**建议的第一步**：新建空白文档，写一个标题。就这么简单。\n\n完成后告诉我，我给你庆祝。"
)
b3_out = make_output(COL[5], y_positions[2], "专注输出")

# 分支4: 任务列表
b4_llm = make_llm(
    COL[3], y_positions[3],
    "任务列表",
    P_PERSONA + "用清晰、不压迫的方式展示任务列表。按优先级排序但不强调紧迫感。给用户选择空间。",
    TASKS_POOL + """\n\n请展示今日任务列表。

输出格式：
**今日 5 件事**

⬜ [高] 完成产品方案初稿 · 2h
⬜ [中] 回复客户邮件 · 0.5h
⬜ [中] 代码审查 · 1.5h
⬜ [低] 更新项目文档 · 1h
⬜ [低] 整理会议笔记 · 0.5h

想先从哪件开始？或者我帮你按能量重排？"""
)
b4_out = make_output(COL[4], y_positions[3], "列表输出")

# 分支5: 情绪推荐
b5_llm = make_llm(
    COL[3], y_positions[4],
    "情绪推荐",
    P_PERSONA + "根据用户的情绪/能量状态推荐合适的任务。先共情，再推荐。永远给选择权。",
    "用户说TA现在很累/状态不好。\n\n请推荐3个低能量也能做的小任务：\n1. 整理桌面 5分钟\n2. 回复1封简单邮件 10分钟\n3. 给文件重命名归档 8分钟\n\n输出格式：\n**状态不好？那就做小事**\n\n累了就别逼自己做难的。从这3件小事里挑一个：\n\n🟢 整理桌面 · 5分钟\n🟢 回一封简单邮件 · 10分钟\n🟢 文件归档 · 8分钟\n\n做完一件就算今天有进展。"
)
b5_out = make_output(COL[4], y_positions[4], "推荐输出")

# 分支6: 完成任务（新增）
b6_q = make_questioner(
    COL[3], y_positions[5],
    "完成任务名",
    "完成了哪件事？告诉我任务名字。",
    option_type="reply_directly"
)
b6_llm = make_llm(
    COL[4], y_positions[5],
    "完成庆祝",
    P_PERSONA + """用户完成了一个任务。请给出真诚的庆祝反馈。
从以下风格中随机选一种：
- 温暖型
- 幽默型
- P型共鸣型（"看吧，你说做就做了"）
- 安静型（"不错，又前进了一步"）

不要过度夸张，保持克制。""",
    "用户完成了：{{任务名}}\n\n请输出庆祝语（15字以内标题 + 一句补充）。"
)
b6_out = make_output(COL[5], y_positions[5], "完成输出")

# 分支7: 想法桶（新增）
b7_q = make_questioner(
    COL[3], y_positions[6],
    "想法内容",
    "想到什么了？记下来，放进 someday 桶，以后再说。",
    option_type="reply_directly"
)
b7_llm = make_llm(
    COL[4], y_positions[6],
    "存入想法桶",
    P_PERSONA + "用户想到了一个新想法。请温柔地接住这个想法，告诉TA已经放进someday桶了，不需要现在就做。",
    "用户的想法：{{想法内容}}\n\n请输出：\n✅ 已存入想法桶\n\n想法内容：{{想法内容}}\n\n放心，我帮你存着。等你想做的时候，随时可以拿出来。\n现在先专注今天要做的事就好。"
)
b7_out = make_output(COL[5], y_positions[6], "想法桶输出")

# 分支8: 重置今日（新增）
b8_llm = make_llm(
    COL[3], y_positions[7],
    "重置今日",
    P_PERSONA + """用户想重置今天。
这是P型人格常见的情况——计划崩了就想重来。
不要评判，不要说"你怎么又重置"。
要支持、要温柔、要给"fresh start"的感觉。""",
    "用户想重新开始今天。\n\n请输出：\n**好，今天重新开始** ✨\n\n之前的全部清零，不评判，不留痕迹。\n\n现在告诉我：现在你感觉怎么样？想从哪件事开始？\n\n或者...要不先做个能量打卡？"
)
b8_out = make_output(COL[4], y_positions[7], "重置输出")

# 分支9: 兜底
b9_llm = make_llm(
    COL[3], y_positions[8],
    "兜底回复",
    P_PERSONA + """你的能力：
- 能量打卡：说"几格电/状态怎么样"，我帮你重排任务
- 任务拆解：说"拖延了/卡住了"，我帮你拆成5分钟步骤
- 专注模式：说"我要专注"，我帮你藏起其他任务
- 任务列表：说"今天干什么"，我展示任务
- 情绪推荐：说"我很累"，我推荐低能量任务
- 完成打卡：说"做完了"，我帮你庆祝
- 想法桶：说"记个想法"，我帮你存到someday
- 重置今日：说"重新开始"，一切清零重来

语气：温暖、支持、像朋友，不评判，不push。""",
    "用户说：{{用户输入}}\n\n请友好回应，并介绍FlowSync能帮用户做什么。\n如果是打招呼，温暖回应后引导用户说出需求。\n如果是闲聊，简短回应后拉回正题。"
)
b9_out = make_output(COL[4], y_positions[8], "兜底输出")

end = make_end(COL[7], 620)

all_components = [
    start, intent, branch,
    b1_q, b1_llm, b1_out,
    b2_q, b2_llm, b2_out,
    b3_mem, b3_llm, b3_out,
    b4_llm, b4_out,
    b5_llm, b5_out,
    b6_q, b6_llm, b6_out,
    b7_q, b7_llm, b7_out,
    b8_llm, b8_out,
    b9_llm, b9_out,
    end
]

base["schema"]["components"] = all_components
base["schema"]["connections"] = []
base["name"] = "FlowSync"
base["description"] = "FlowSync是懂P型人格的情绪任务助手。通过每日能量打卡，AI主动重排任务、拆解拖延、柔性回归，陪你专注一件事。支持语音对话、桌面卡片与跨设备接续，让计划随心情而动。"

with open('flowsync-workflow-v2.json', 'w', encoding='utf-8') as f:
    json.dump(base, f, ensure_ascii=False, indent=2)

print(f"V2: {len(all_components)} components")
print(f"Branches: 9 (energy/task_split/focus/list/mood/complete/someday/reset/default)")
print("Output: flowsync-workflow-v2.json")
