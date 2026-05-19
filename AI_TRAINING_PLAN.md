# 国风AI文化助手 - 模型训练方案

## 一、项目概述

本方案旨在训练一个针对中华传统文化领域的AI对话助手模型，具备自然对话能力和传统文化知识问答能力。

## 二、数据准备

### 2.1 数据集收集

| 数据类型 | 来源 | 数量目标 |
|---------|------|---------|
| 对话语料 | 公开对话数据集、人工标注 | 10万+条 |
| 传统文化知识 | 百科全书、古籍文献、非遗资料 | 5万+条 |
| 诗词数据 | 唐诗宋词数据库 | 2万+首 |
| 民俗知识 | 传统节日、节气资料 | 1万+条 |

### 2.2 数据清洗

```python
# 数据清洗流程
def clean_data(text):
    # 去除特殊字符和噪声
    text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s]', '', text)
    # 去除多余空格
    text = ' '.join(text.split())
    # 统一编码
    text = text.encode('utf-8').decode('utf-8')
    return text
```

### 2.3 数据划分

| 数据集 | 比例 | 用途 |
|-------|------|------|
| 训练集 | 70% | 模型训练 |
| 验证集 | 20% | 超参数调优 |
| 测试集 | 10% | 最终评估 |

## 三、模型架构设计

### 3.1 模型选择

| 模型类型 | 选择理由 |
|---------|---------|
| BERT-base-chinese | 中文语义理解能力强，预训练模型成熟 |
| ERNIE | 百度中文优化模型，对中文语境理解更好 |

### 3.2 模型配置

```python
# 模型架构配置
model_config = {
    'model_name': 'bert-base-chinese',
    'num_hidden_layers': 12,
    'hidden_size': 768,
    'num_attention_heads': 12,
    'intermediate_size': 3072,
    'activation_function': 'gelu',
    'vocab_size': 21128,
    'max_position_embeddings': 512,
}
```

### 3.3 微调策略

- **任务类型**: 问答任务 + 对话生成任务
- **输出层设计**: 分类层（意图识别）+ 生成层（回答生成）

## 四、训练策略

### 4.1 优化器选择

| 优化器 | 参数设置 |
|-------|---------|
| AdamW | lr=2e-5, weight_decay=0.01 |
| 学习率调度 | Linear Warmup + Cosine Decay |

### 4.2 训练参数

```python
training_config = {
    'batch_size': 32,
    'epochs': 5,
    'warmup_ratio': 0.1,
    'max_grad_norm': 1.0,
    'logging_steps': 100,
    'eval_steps': 500,
    'save_steps': 1000,
}
```

### 4.3 损失函数

- **分类任务**: CrossEntropyLoss
- **生成任务**: CrossEntropyLoss (token-level)
- **多任务学习**: 加权损失组合

## 五、监控与调优

### 5.1 监控指标

| 指标 | 监控频率 | 预警阈值 |
|------|---------|---------|
| 训练损失 | 每100步 | - |
| 验证损失 | 每500步 | 连续3次上升 |
| 准确率 | 每500步 | < 80% |
| F1分数 | 每500步 | < 0.75 |

### 5.2 过拟合检测

```python
# 过拟合检测逻辑
def detect_overfitting(train_loss, val_loss, threshold=0.5):
    if train_loss < val_loss - threshold:
        return True
    return False
```

### 5.3 调优策略

| 问题 | 解决方案 |
|------|---------|
| 过拟合 | 增加dropout、数据增强、早停 |
| 训练速度慢 | 增大batch_size、混合精度训练 |
| 梯度消失 | 调整学习率、使用残差连接 |

## 六、性能评估

### 6.1 评估指标

| 指标 | 计算公式 | 目标值 |
|------|---------|-------|
| 准确率 | correct / total | ≥ 90% |
| 精确率 | TP / (TP+FP) | ≥ 88% |
| 召回率 | TP / (TP+FN) | ≥ 88% |
| F1分数 | 2*P*R/(P+R) | ≥ 0.88 |
| BLEU-4 | n-gram匹配度 | ≥ 0.6 |

### 6.2 评估流程

```python
# 评估代码框架
def evaluate(model, test_loader):
    model.eval()
    total_loss = 0
    correct = 0
    with torch.no_grad():
        for batch in test_loader:
            inputs, labels = batch
            outputs = model(inputs)
            loss = loss_fn(outputs, labels)
            total_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            correct += (preds == labels).sum().item()
    accuracy = correct / len(test_loader.dataset)
    return total_loss / len(test_loader), accuracy
```

## 七、模型优化

### 7.1 正则化处理

- **Dropout**: 在全连接层添加 dropout=0.3
- **Weight Decay**: L2正则化，系数=0.01
- **Early Stopping**: 验证损失连续5次不降则停止

### 7.2 特征工程

```python
# 特征增强
def augment_data(text):
    augmentations = [
        synonym_replacement,    # 同义词替换
        random_insertion,       # 随机插入
        random_deletion,        # 随机删除
        random_swap,            # 随机交换
    ]
    return augmentations[random.randint(0, len(augmentations)-1)](text)
```

### 7.3 模型压缩

| 压缩技术 | 压缩率 | 精度损失 |
|---------|--------|---------|
| 量化 | 4x | < 2% |
| 剪枝 | 3x | < 1% |
| 知识蒸馏 | 2x | < 3% |

## 八、部署方案

### 8.1 模型格式转换

```bash
# PyTorch转ONNX
torch.onnx.export(model, dummy_input, 'model.onnx')

# ONNX转TensorRT
trtexec --onnx=model.onnx --saveEngine=model.engine
```

### 8.2 API服务搭建

```python
# Flask API示例
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    question = data.get('question')
    answer = model.predict(question)
    return jsonify({'answer': answer})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 8.3 前端集成

```javascript
// 前端调用示例
async function getAIResponse(question) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
    });
    return await response.json();
}
```

## 九、训练进度跟踪

| 阶段 | 预计时间 | 状态 |
|------|---------|------|
| 数据收集 | 1周 | ☐ |
| 数据清洗 | 3天 | ☐ |
| 模型训练 | 2周 | ☐ |
| 超参数调优 | 1周 | ☐ |
| 性能评估 | 3天 | ☐ |
| 模型部署 | 3天 | ☐ |

## 十、风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| 数据质量差 | 中 | 模型效果差 | 人工审核、数据清洗 |
| 过拟合 | 高 | 泛化能力差 | 正则化、早停 |
| 训练资源不足 | 中 | 训练中断 | 分布式训练、云服务 |
| 部署延迟 | 低 | 用户体验差 | 模型压缩、CDN加速 |

---

## 附录：当前前端实现方案

由于当前项目为纯前端应用，采用**规则引擎+知识库**的方式实现AI助手：

```javascript
// 当前实现架构
class AIAssistant {
    constructor() {
        this.knowledgeBase = [
            { keywords: ['静夜思', '李白'], answer: '...' },
            // 更多知识条目
        ];
        this.chatHistory = [];
    }
    
    generateResponse(message) {
        // 1. 意图识别（规则匹配）
        // 2. 知识检索（关键词匹配）
        // 3. 回复生成（模板填充）
    }
}
```

### 前端优化建议

1. **知识库扩展**: 增加更多传统文化知识条目
2. **意图识别优化**: 使用更复杂的规则匹配
3. **对话记忆**: 保存对话历史，支持上下文理解
4. **响应缓存**: 对相同问题进行缓存，提高响应速度

---

**文档版本**: v1.0  
**创建日期**: 2026-05-18  
**作者**: AI训练团队