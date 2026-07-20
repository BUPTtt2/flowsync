import json
import copy

with open('nengliang-V0.json', 'r', encoding='utf-8') as f:
    base = json.load(f)

components = []
connections = []
node_id_counter = 1000

def nid(prefix):
    global node_id_counter
    node_id_counter += 1
    return f"{prefix}{node_id_counter}"

def make_start(x, y):
    return {
        "id": nid("START"),
        "type": "agentStart",
        "dimensions": {"width": 248, "height": 141},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": "开始",
        "outputs": [
            {
                "name": "systemFields",
                "fields": [
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
            },
            {"name": "userFields", "fields": []}
        ],
        "description": "工作流开始的节点，用于设定启动工作流需要的信息"
    }

def make_end(x, y):
    return {
        "id": nid("END"),
        "type": "agentEnd",
        "dimensions": {"width": 248, "height": 79},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": "结束",
        "outputs": [
            {
                "name": "userFields",
                "fields": [
                    {"name": "output", "type": "String", "required": True, "description": "",
                     "sourceType": "input"}
                ]
            },
            {
                "name": "combinationConfig",
                "fields": [
                    {"name": "stepInfo", "type": "String", "required": True,
                     "description": "思考状态，请勿引用流式变量", "value": "",
                     "sourceType": "input", "unEditName": True, "deleteDisabled": True, "typeDisabled": True},
                    {"name": "outputId", "displayName": "streamingTextId", "type": "String", "required": False,
                     "description": "输出流id，请勿引用流式变量，最大长度为50个字符", "value": "",
                     "sourceType": "input", "unEditName": True, "deleteDisabled": True,
                     "typeDisabled": True, "maxlength": 50}
                ]
            }
        ],
        "description": "工作流的结束节点，工作流的运行结果将返回给智能体",
        "configs": {}
    }

def make_intent(x, y):
    branches = [
        {"branchId": "energy_check", "handleId": "energy_check", "catalog": "能量打卡"},
        {"branchId": "task_split", "handleId": "task_split", "catalog": "任务拆解"},
        {"branchId": "focus_now", "handleId": "focus_now", "catalog": "专注模式"},
        {"branchId": "task_list", "handleId": "task_list", "catalog": "任务列表"},
        {"branchId": "mood_rec", "handleId": "mood_rec", "catalog": "情绪推荐"},
        {"branchId": "default", "handleId": "default", "catalog": "默认分类"}
    ]
    return {
        "id": nid("INTENT"),
        "type": "jiuwen.IntentDetectionComponent",
        "dimensions": {"width": 248, "height": 340},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": "意图分类",
        "description": "模型通过理解用户的自然语言，执行对应的分支流程",
        "inputs": [
            {
                "name": "preDefinedFields",
                "fields": [
                    {"name": "query", "type": "String", "required": True, "description": "",
                     "sourceType": "input", "deleteDisabled": True, "nameDisabled": True,
                     "typeDisabled": True, "unEditName": True}
                ]
            }
        ],
        "outputs": [
            {
                "name": "preDefinedFields",
                "fields": [
                    {"name": "classificationId", "type": "String", "required": True, "description": ""},
                    {"name": "reason", "type": "String", "required": True, "description": ""}
                ]
            }
        ],
        "configs": {
            "modelConfigs": {
                "llmContextLength": "64k",
                "llmOwner": 1
            },
            "prompt": "你是FlowSync智能体的意图分类器。FlowSync是一个面向P型人格的情绪感知任务助手。\n\n请将用户输入分类到以下意图之一：\n- energy_check：能量打卡、心情如何、今天几格电、状态怎么样、我今天状态\n- task_split：拆任务、拖延了、不想做、卡住了、帮我拆解、SOS、启动困难\n- focus_now：我要专注、只做一件事、开始工作、进入专注模式、单一焦点\n- task_list：今天干什么、我的任务、待办、有什么安排、任务列表\n- mood_rec：推荐任务、我现在很累该做什么、适合做什么、根据心情推荐\n- other：打招呼、闲聊、其他无关内容\n\n请只返回 classificationId，不要解释。",
            "branches": branches,
            "context": {
                "dialogueHistorySwitch": True,
                "dialogueHistoryType": "self"
            }
        }
    }

def make_branch(x, y, num_cases):
    branches = []
    for i in range(num_cases):
        branches.append({
            "id": f"SwitchCase{i+1}",
            "condition": "==",
            "expression": [
                {
                    "leftVar": {"value": "", "fieldType": "String"},
                    "condition": "==",
                    "rightVar": {"sourceType": "input", "value": "", "fieldType": "String"}
                }
            ]
        })
    branches.append({"id": "default"})
    return {
        "id": nid("BRANCH"),
        "type": "AgentBranch",
        "dimensions": {"width": 248, "height": 149 + num_cases * 20},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": "选择器",
        "description": "连接多个下游分支，若设定的条件成立则仅运行对应的分支，若均不成立则只运行否则分支",
        "branches": branches
    }

def make_questioner(x, y, label, question, option_type="reply_based_on_options", options=None, extracted=False):
    branches = []
    if options:
        for i, opt in enumerate(options):
            branches.append({
                "branchId": f"branch_{i+1}",
                "catalog": opt["label"]
            })
    branches.append({"branchId": "default", "catalog": "默认类别"})
    
    extracted_fields = []
    if extracted:
        extracted_fields = [
            {"fieldName": "", "description": "", "cnFieldName": "", "defaultValue": "",
             "required": True, "fieldType": "String", "refValue": "", "sourceType": "ref"}
        ]
    
    return {
        "id": nid("Q"),
        "type": "jiuwen.QuestionerComponent",
        "dimensions": {"width": 248, "height": 280 if options else 221},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": label,
        "description": "直接问答、参数提取&追问",
        "inputs": [
            {"name": "userFields", "fields": [
                {"name": "", "type": "String", "required": False, "description": "",
                 "value": "", "sourceType": "input"}
            ]},
            {"name": "preDefinedFields", "fields": []}
        ],
        "outputs": [
            {
                "name": "preDefinedFields",
                "fields": [
                    {"name": "userResponse", "displayName": "USER_RESPONSE", "type": "String",
                     "required": True, "description": "用户本轮回答内容"}
                ]
            }
        ],
        "configs": {
            "modelConfigs": {
                "llmName": "",
                "llmContextLength": 4096,
                "llmOwner": "",
                "hyperParameters": {"temperature": 0.2, "topP": 0.9}
            },
            "extraInstruction": "",
            "questionContent": question,
            "isExtractedFields": extracted,
            "extractedFields": extracted_fields,
            "maxResponse": 5,
            "responseType": "reply_directly",
            "optionType": option_type,
            "branches": branches,
            "context": {
                "dialogueHistorySwitch": False,
                "dialogueHistoryType": "self"
            },
            "maxTimeOut": 30,
            "timeOutWarnsMessage": ""
        }
    }

def make_llm(x, y, label, system_prompt, user_prompt_template):
    return {
        "id": nid("LLM"),
        "type": "AgentLargeModel",
        "dimensions": {"width": 248, "height": 310},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": label,
        "description": "调用大模型，根据入参和Prompt，生成回复",
        "inputs": [
            {"name": "userFields", "fields": [
                {"name": "", "type": "String", "required": True, "description": "",
                 "sourceType": "input"}
            ]}
        ],
        "outputs": [
            {"name": "userFields", "fields": [
                {"name": "output", "type": "String", "required": True, "description": ""}
            ]}
        ],
        "configs": {
            "deployMode": "workflow",
            "model": {
                "llmContextLength": "64k",
                "llmOwner": 1,
                "hyperParameters": []
            },
            "templateContent": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt_template}
            ],
            "responseFormat": {"type": "markdown"},
            "skillList": [],
            "context": {
                "dialogueHistorySwitch": True,
                "dialogueHistoryType": "self"
            }
        }
    }

def make_output(x, y, label="输出"):
    return {
        "id": nid("OUT"),
        "type": "xiaoyi.outputComponent",
        "dimensions": {"width": 248, "height": 145},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": label,
        "description": "",
        "inputs": [],
        "outputs": [
            {"name": "userFields", "fields": [
                {"name": "output", "type": "String", "required": True, "description": "",
                 "value": "", "sourceType": "input"}
            ]},
            {"name": "combinationConfig", "fields": []}
        ],
        "configs": {
            "responseTemplate": "",
            "isStreamOut": False,
            "isStreamingText": False,
            "outputMode": "OutputStream",
            "context": {"dialogueHistorySwitch": True}
        }
    }

def make_memory(x, y, label="长期记忆", query_template=""):
    return {
        "id": nid("MEM"),
        "type": "xiaoyi.AgentMemoryComponent",
        "dimensions": {"width": 248, "height": 147},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": label,
        "description": "用于调用长期记忆，获取用户的个性化信息，智能体必须打开长期记忆",
        "inputs": [
            {"name": "preDefinedFields", "fields": [
                {"name": "query", "type": "String", "required": True,
                 "description": "输入需要从长期记忆中匹配的关键信息",
                 "value": query_template, "sourceType": "input"}
            ]}
        ],
        "outputs": [
            {"name": "preDefinedFields", "fields": [
                {"name": "memory", "description": "memory", "type": "Array<Object>",
                 "required": False, "enabled": False,
                 "nextOutputParamInfo": [
                     {"name": "memoryContent", "description": "memoryContent",
                      "type": "String", "required": False, "enabled": False},
                     {"name": "createTime", "description": "createTime",
                      "type": "String", "required": False, "enabled": False}
                 ]}
            ]}
        ],
        "configs": {}
    }

def make_textproc(x, y, label="文本处理", functionality="concat", template=""):
    return {
        "id": nid("TEXT"),
        "type": "jiuwen.TextProcessingComponent",
        "dimensions": {"width": 248, "height": 147},
        "selected": False, "dragging": False, "resizing": False,
        "initialized": False, "isParent": False,
        "position": {"x": x, "y": y},
        "events": {},
        "label": label,
        "description": "对前序节点输入的内容进行字符串拼接、字符串分隔",
        "inputs": [
            {"name": "userFields", "fields": [
                {"name": "", "type": "String", "required": True, "description": "",
                 "value": "", "sourceType": "input"}
            ]}
        ],
        "outputs": [
            {"name": "preDefinedFields", "fields": [
                {"name": "output", "type": "String", "required": True, "description": ""}
            ]}
        ],
        "configs": {
            "functionality": functionality,
            "listJoinString": "\\n",
            "concatTemplate": template,
            "splitStringList": [],
            "customSeparatorList": [],
            "customConnectionList": []
        }
    }

# ─── 构建节点 ───────────────────────────────────────────────
# 列位置
COL = [50, 360, 670, 980, 1290, 1600, 1910, 2220]

# 主链路
start = make_start(COL[0], 450)
intent = make_intent(COL[1], 380)
branch = make_branch(COL[2], 400, 5)

# 分支1: 能量打卡 (最上方)
y_energy = 60
q_energy = make_questioner(
    COL[3], y_energy,
    "能量打卡提问",
    "今天感觉几格电？我会根据你的状态重排今天的任务。\n\n【满电】硬骨头先上\n【不错】中等难度合适\n【一般】先做机械活热身\n【偏累】只做1件5分钟小事",
    options=[
        {"label": "满电"}, {"label": "不错"}, {"label": "一般"}, {"label": "偏累"}
    ]
)
llm_energy = make_llm(
    COL[4], y_energy,
    "AI重排任务",
    "你是FlowSync任务调度助手，专门服务于P型人格（知觉型）创意工作者。\n\n核心原则：\n1. 共情优先，不评判，不制造焦虑\n2. 承认P型节奏不同于J型，慢一点没关系\n3. 能量低的时候只给最小任务，不给压力\n4. 用温暖、支持的语气，像朋友一样\n\n今日任务池：\n- 完成产品方案初稿（高优先级，2h，创造性）\n- 更新项目文档（中优先级，1h，机械）\n- 回复客户邮件（中优先级，0.5h，沟通）\n- 整理会议笔记（低优先级，0.5h，机械）\n- 代码审查（中优先级，1.5h，专注）",
    "用户选择的能量等级：{{用户选择}}\n\n请根据能量等级重新排序今日任务，并给出共情式回复。\n\n输出格式：\n第一行：一句共情反馈（承认P型状态，温暖不评判）\n\n**今日安排（重排后）**\n1. [优先级] 任务名 · 预计时长 · 原因\n2. ...\n\n**小建议**：\n一句柔性建议"
)
out_energy = make_output(COL[5], y_energy, "能量打卡输出")

# 分支2: 任务拆解
y_split = 280
q_split = make_questioner(
    COL[3], y_split,
    "任务名提问",
    "哪个任务卡住了？告诉我任务名字，我帮你拆成5分钟能启动的小步骤。",
    option_type="reply_directly"
)
llm_split = make_llm(
    COL[4], y_split,
    "AI拆解任务",
    "你是FlowSync任务拆解助手，专门帮助P型人格克服启动困难。\n\n核心原则：\n1. 拖延不是懒，是大脑在保护你\n2. 把任务拆到最小可执行，小到不可能失败\n3. 第一步必须是最无压力的动作（打开工具、看一眼、新建文件）\n4. 允许做了第一步就暂停，不要求全做完\n5. 语气温柔、共情、不评判",
    "用户说TA拖延了这个任务：{{任务名}}\n\n请把这个任务拆解成3个'5分钟启动版'步骤：\n- 第1步：最小启动动作（1分钟内能完成，零压力）\n- 第2步：推进一小步（3分钟）\n- 第3步：可以暂停的节点（1分钟收尾）\n\n每个步骤标注预计时间。\n\n输出格式：\n先一句共情开场（承认拖延很正常，不需要自责）\n\n**5分钟启动版**\n1. 步骤名 · X分钟\n2. 步骤名 · X分钟\n3. 步骤名 · X分钟\n\n最后一句鼓励：做完第一步就算赢，随时可以停下。"
)
out_split = make_output(COL[5], y_split, "拆解输出")

# 分支3: 专注模式
y_focus = 500
mem_focus = make_memory(COL[3], y_focus, "读取当前任务", "当前最高优先级任务")
llm_focus = make_llm(
    COL[4], y_focus,
    "单一焦点",
    "你是FlowSync专注模式助手。用户进入了单一焦点模式，其他所有任务都被隐藏。\n\n原则：\n1. 只聚焦一件事，不提醒其他任务\n2. 给用户清晰的启动建议\n3. 语气坚定但温暖，像一个安静的陪伴者",
    "用户想进入专注模式。\n\n请输出：\n**单一焦点模式**\n\n其他任务我都藏起来了。现在只做这一件事：\n\n👉 **完成产品方案初稿**\n   预计 2 小时 · 高优先级\n\n**建议的第一步**：新建空白文档，写一个标题。就这么简单。\n\n完成后告诉我，我给你庆祝。"
)
out_focus = make_output(COL[5], y_focus, "专注输出")

# 分支4: 任务列表
y_list = 720
llm_list = make_llm(
    COL[3], y_list,
    "任务列表",
    "你是FlowSync任务助手。用清晰、不压迫的方式展示用户的任务列表。\n\n原则：\n1. 不制造焦虑，只展示信息\n2. 按优先级排序但不强调紧迫感\n3. 给用户选择空间，不push",
    "请展示今日任务列表：\n\n1. [高] 完成产品方案初稿 · 2h\n2. [中] 回复客户邮件 · 0.5h  \n3. [中] 代码审查 · 1.5h\n4. [低] 更新项目文档 · 1h\n5. [低] 整理会议笔记 · 0.5h\n\n输出格式：\n**今日 5 件事**\n\n按优先级排列，每件前面带一个小方块。\n最后加一句：想先从哪件开始？或者我帮你按能量重排？"
)
out_list = make_output(COL[4], y_list, "列表输出")

# 分支5: 情绪推荐
y_mood = 920
llm_mood = make_llm(
    COL[3], y_mood,
    "情绪推荐",
    "你是FlowSync情绪推荐助手。根据用户的情绪/能量状态推荐合适的任务。\n\n原则：\n1. 先共情，再推荐\n2. 能量低就推机械任务，不推创造性任务\n3. 永远给用户选择权，不说你应该",
    "用户说TA现在很累/状态不好。\n\n请推荐3个低能量也能做的小任务：\n1. 整理桌面 5分钟\n2. 回复1封简单邮件 10分钟\n3. 给文件重命名归档 8分钟\n\n输出格式：\n**状态不好？那就做小事**\n\n累了就别逼自己做难的。从这3件小事里挑一个：\n\n🟢 整理桌面 · 5分钟\n🟢 回一封简单邮件 · 10分钟\n🟢 文件归档 · 8分钟\n\n做完一件就算今天有进展。"
)
out_mood = make_output(COL[4], y_mood, "推荐输出")

# 默认分支
y_other = 1120
llm_other = make_llm(
    COL[3], y_other,
    "兜底回复",
    "你是FlowSync助手，一个懂P型人格的情绪任务助手。\n\n你的能力：\n- 能量打卡：告诉用户状态，我帮你重排任务\n- 任务拆解：说拖延了/卡住了，我帮你拆成5分钟步骤\n- 专注模式：说我要专注，我帮你藏起其他任务\n- 任务列表：说今天干什么，我展示任务\n- 情绪推荐：说我很累，我推荐低能量任务\n\n语气：温暖、支持、像朋友，不评判，不push。",
    "用户说：{{用户输入}}\n\n请友好回应，并介绍FlowSync能帮用户做什么。\n如果是打招呼，就温暖回应然后引导用户说出需求。\n如果是闲聊，就简短回应然后拉回任务主题。"
)
out_other = make_output(COL[4], y_other, "兜底输出")

end = make_end(COL[7], 520)

# 添加所有组件
all_components = [
    start, intent, branch,
    q_energy, llm_energy, out_energy,
    q_split, llm_split, out_split,
    mem_focus, llm_focus, out_focus,
    llm_list, out_list,
    llm_mood, out_mood,
    llm_other, out_other,
    end
]

base["schema"]["components"] = all_components
base["schema"]["connections"] = []

with open('flowsync-workflow-v1.json', 'w', encoding='utf-8') as f:
    json.dump(base, f, ensure_ascii=False, indent=2)

print(f"Generated {len(all_components)} components")
print("Output: flowsync-workflow-v1.json")
