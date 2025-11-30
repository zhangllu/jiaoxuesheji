import { Shortcut } from './types';

export const SHORTCUTS: Shortcut[] = [
  {
    id: 'core-competencies',
    title: '指向核心素养的目标设计',
    description: '根据课程标准，设计符合学科核心素养的教学目标（知识、能力、素养）。',
    category: '教学设计',
    iconName: 'target',
    color: 'bg-blue-100 text-blue-600',
    promptTemplate: `作为一名资深K-12教师和课程设计专家，请帮助我设计一节课的教学目标。
请遵循以下步骤：
1. 确认学科和年级。
2. 明确本节课的主题。
3. 基于学科核心素养（如：批判性思维、问题解决、文化自信等），设计三个维度的目标：
   - 知识与技能
   - 过程与方法
   - 情感态度与价值观
4. 确保目标使用布鲁姆教育目标分类法中的动词，具体可测。

请先询问我：学科、年级以及课题名称。`
  },
  {
    id: 'rubric-design',
    title: '评价量规设计',
    description: '为特定的学习任务或项目设计结构化、可视化的评价量规（Rubrics）。',
    category: '教学评价',
    iconName: 'listChecks',
    color: 'bg-green-100 text-green-600',
    promptTemplate: `请帮助我为学生的一个学习任务设计一份详细的评价量规 (Rubric)。
任务类型可以是：写作、演讲、科学实验报告、小组合作项目等。

量规要求：
- 包含 3-5 个评价维度（Criteria）。
- 每个维度分为 4 个等级（例如：优秀、良好、合格、待改进）。
- 每个等级必须有具体的行为描述，而非模糊的形容词。

请先询问我：具体的学习任务是什么，以及适用的年级。`
  },
  {
    id: 'activity-design',
    title: '深度学习活动设计',
    description: '设计能激发学生主动参与、深度思考的课堂活动。',
    category: '活动设计',
    iconName: 'puzzle',
    color: 'bg-purple-100 text-purple-600',
    promptTemplate: `请为我设计一个能促进学生深度学习的课堂活动。
活动应包含：
1. 活动名称与目标。
2. 任务情境：真实或模拟的真实情境。
3. 活动流程：明确的步骤（导入、探究、展示、反思）。
4. 支架设计：教师提供的资源或指导语。
5. 预期成果：学生产出的作品或表现。

请先询问我：课程主题、学生年级以及你希望培养的关键能力（如合作、创新等）。`
  },
  {
    id: 'pbl-driving-question',
    title: 'PBL 驱动性问题设计',
    description: '为项目化学习（PBL）设计具有挑战性、开放性和真实性的驱动性问题。',
    category: '项目化学习',
    iconName: 'zap',
    color: 'bg-yellow-100 text-yellow-600',
    promptTemplate: `作为PBL项目设计专家，请帮我打磨一个驱动性问题 (Driving Question)。
一个好的驱动性问题应该是：
- 开放的（没有单一标准答案）。
- 真实的（与现实生活相关）。
- 能够驱动持续探究的。
- 也就是 "How might we..." 或 "我们如何..." 的形式。

请先询问我：项目的主题或核心概念，以及学生可能感兴趣的现实生活联系。`
  },
  {
    id: 'question-chain',
    title: '问题链设计',
    description: '设计一组逻辑递进的问题，引导学生从低阶思维走向高阶思维。',
    category: '课堂提问',
    iconName: 'helpCircle',
    color: 'bg-pink-100 text-pink-600',
    promptTemplate: `请帮我针对一个教学知识点设计一组“问题链”。
问题链应遵循认知发展规律，包含：
1. 记忆性问题（Recall）：唤醒旧知。
2. 理解性问题（Understand）：阐释概念。
3. 应用性问题（Apply）：解决简单问题。
4. 分析与评价问题（Analyze & Evaluate）：深度剖析与批判。
5. 创造性问题（Create）：提出新见解或方案。

请先询问我：具体的教学内容或知识点。`
  },
  {
    id: 'lesson-plan',
    title: '完整教案生成',
    description: '生成一份包含教学目标、重难点、过程和反思的完整标准教案。',
    category: '教学设计',
    iconName: 'layout',
    color: 'bg-orange-100 text-orange-600',
    promptTemplate: `请为我生成一份标准的教学设计方案（教案）。
包含以下板块：
1. 课题信息
2. 教学目标（核心素养导向）
3. 教学重难点
4. 教学资源准备
5. 教学过程（包含时间分配、教师活动、学生活动、设计意图）
6. 板书设计
7. 作业布置

请先询问我：学科、年级、课题名称以及教材版本（如有）。`
  },
];