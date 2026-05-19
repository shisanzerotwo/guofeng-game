#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
国风AI文化助手 - 训练脚本
适用于纯Python环境（CPU训练）
"""

import json
import random
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("警告：未安装PyTorch，将使用纯NumPy实现")

# ==================== 配置参数 ====================
CONFIG = {
    'epochs': 20,
    'batch_size': 8,
    'learning_rate': 0.001,
    'train_ratio': 0.7,
    'val_ratio': 0.2,
    'test_ratio': 0.1,
    'embedding_dim': 128,
    'hidden_dim': 256,
    'num_classes': 15,
    'max_seq_len': 32,
}

# ==================== 数据集准备 ====================
class CulturalDataset:
    """传统文化问答数据集"""
    
    def __init__(self):
        self.data = self._generate_data()
        self.vocab = self._build_vocab()
        self.label_map = self._build_label_map()
    
    def _generate_data(self):
        """生成模拟的传统文化问答数据"""
        data = []
        
        # 诗词类
        poems = [
            {"question": "床前明月光的作者是谁", "answer": "李白", "category": "诗词"},
            {"question": "欲穷千里目下一句是什么", "answer": "更上一层楼", "category": "诗词"},
            {"question": "白日依山尽是哪首诗的句子", "answer": "登鹳雀楼", "category": "诗词"},
            {"question": "举头望明月表达了什么情感", "answer": "思乡", "category": "诗词"},
            {"question": "春眠不觉晓的作者是谁", "answer": "孟浩然", "category": "诗词"},
        ]
        
        # 非遗类
        feiyi = [
            {"question": "剪纸是哪一年列入非遗的", "answer": "2006年", "category": "非遗"},
            {"question": "皮影戏使用什么材料制作", "answer": "兽皮", "category": "非遗"},
            {"question": "活字印刷是谁发明的", "answer": "毕昇", "category": "非遗"},
            {"question": "苏绣属于四大名绣之一吗", "answer": "是", "category": "非遗"},
            {"question": "景泰蓝是什么工艺", "answer": "铜胎掐丝珐琅", "category": "非遗"},
        ]
        
        # 民俗类
        folk = [
            {"question": "春节是农历几月几号", "answer": "正月初一", "category": "民俗"},
            {"question": "端午节吃什么", "answer": "粽子", "category": "民俗"},
            {"question": "中秋节的传统食物是什么", "answer": "月饼", "category": "民俗"},
            {"question": "重阳节要做什么", "answer": "登高", "category": "民俗"},
            {"question": "二十四节气有多少个", "answer": "24个", "category": "民俗"},
        ]
        
        # 纹样类
        patterns = [
            {"question": "祥云纹象征什么", "answer": "吉祥", "category": "纹样"},
            {"question": "饕餮纹常见于什么器物", "answer": "青铜器", "category": "纹样"},
            {"question": "回纹是什么形状的", "answer": "方形回旋", "category": "纹样"},
            {"question": "缠枝纹常用于什么装饰", "answer": "瓷器", "category": "纹样"},
            {"question": "龙纹代表什么", "answer": "皇权", "category": "纹样"},
        ]
        
        # 器物类
        artifacts = [
            {"question": "古琴有几根弦", "answer": "7根", "category": "器物"},
            {"question": "青花瓷起源于哪个朝代", "answer": "唐代", "category": "器物"},
            {"question": "紫砂壶产自哪里", "answer": "宜兴", "category": "器物"},
            {"question": "编钟是什么材质的", "answer": "青铜", "category": "器物"},
            {"question": "文房四宝包括什么", "answer": "笔墨纸砚", "category": "器物"},
        ]
        
        data.extend(poems + feiyi + folk + patterns + artifacts)
        return data
    
    def _build_vocab(self):
        """构建词汇表"""
        vocab = {'<PAD>': 0, '<UNK>': 1}
        idx = 2
        for item in self.data:
            for char in item['question'] + item['answer']:
                if char not in vocab:
                    vocab[char] = idx
                    idx += 1
        return vocab
    
    def _build_label_map(self):
        """构建类别映射"""
        categories = sorted(set(item['category'] for item in self.data))
        return {cat: i for i, cat in enumerate(categories)}
    
    def encode_text(self, text):
        """将文本编码为数字序列"""
        encoded = []
        for char in text[:CONFIG['max_seq_len']]:
            encoded.append(self.vocab.get(char, self.vocab['<UNK>']))
        # 填充到最大长度
        while len(encoded) < CONFIG['max_seq_len']:
            encoded.append(self.vocab['<PAD>'])
        return encoded
    
    def split_data(self):
        """划分训练集、验证集、测试集"""
        questions = [self.encode_text(item['question']) for item in self.data]
        answers = [self.encode_text(item['answer']) for item in self.data]
        labels = [self.label_map[item['category']] for item in self.data]
        
        # 分层划分保持类别平衡
        X_train, X_temp, y_train, y_temp = train_test_split(
            questions, labels, test_size=1-CONFIG['train_ratio'], stratify=labels, random_state=42
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=CONFIG['test_ratio']/(CONFIG['val_ratio']+CONFIG['test_ratio']), 
            stratify=y_temp, random_state=42
        )
        
        return {
            'train': {'X': np.array(X_train), 'y': np.array(y_train)},
            'val': {'X': np.array(X_val), 'y': np.array(y_val)},
            'test': {'X': np.array(X_test), 'y': np.array(y_test)},
        }

# ==================== 模型定义 ====================
if TORCH_AVAILABLE:
    class CulturalModel(nn.Module):
        """传统文化问答分类模型"""
        
        def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
            super(CulturalModel, self).__init__()
            self.embedding = nn.Embedding(vocab_size, embedding_dim)
            self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True, bidirectional=True)
            self.fc = nn.Linear(hidden_dim * 2, num_classes)
            self.dropout = nn.Dropout(0.3)
        
        def forward(self, x):
            embeds = self.embedding(x)
            lstm_out, _ = self.lstm(embeds)
            # 取最后一个时间步的输出
            last_hidden = lstm_out[:, -1, :]
            out = self.dropout(last_hidden)
            logits = self.fc(out)
            return logits

else:
    class NumPyModel:
        """纯NumPy实现的简化模型"""
        
        def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
            self.W_emb = np.random.randn(vocab_size, embedding_dim) * 0.01
            self.W_lstm = np.random.randn(4 * hidden_dim, embedding_dim + hidden_dim) * 0.01
            self.W_fc = np.random.randn(num_classes, hidden_dim) * 0.01
            self.b_fc = np.zeros(num_classes)
        
        def relu(self, x):
            return np.maximum(0, x)
        
        def softmax(self, x):
            exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
            return exp_x / np.sum(exp_x, axis=1, keepdims=True)
        
        def forward(self, x):
            batch_size = x.shape[0]
            embeds = self.W_emb[x]  # (batch, seq_len, embed_dim)
            
            # 简化的LSTM前向传播
            h = np.zeros((batch_size, self.W_lstm.shape[1] - self.W_emb.shape[1]))
            for t in range(embeds.shape[1]):
                xt = embeds[:, t, :]
                combined = np.concatenate([xt, h], axis=1)
                gates = self.W_lstm @ combined.T
                i, f, o, g = np.split(gates, 4, axis=0)
                i, f, o = 1 / (1 + np.exp(-i.T)), 1 / (1 + np.exp(-f.T)), 1 / (1 + np.exp(-o.T))
                g = np.tanh(g.T)
                h = f * h + i * g
            
            logits = (self.W_fc @ h.T).T + self.b_fc
            return self.softmax(logits)

# ==================== 训练器 ====================
class Trainer:
    """训练器类"""
    
    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu') if TORCH_AVAILABLE else 'cpu'
        
        if TORCH_AVAILABLE:
            self.model.to(self.device)
            self.criterion = nn.CrossEntropyLoss()
            self.optimizer = optim.Adam(model.parameters(), lr=config['learning_rate'])
            self.scheduler = optim.lr_scheduler.StepLR(self.optimizer, step_size=5, gamma=0.5)
        
        self.history = {
            'train_loss': [],
            'val_loss': [],
            'train_acc': [],
            'val_acc': [],
        }
    
    def train_epoch(self, train_loader):
        """训练一个epoch"""
        if TORCH_AVAILABLE:
            self.model.train()
            total_loss = 0.0
            correct = 0
            total = 0
            
            for batch in train_loader:
                inputs, labels = batch
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item() * inputs.size(0)
                _, preds = torch.max(outputs, 1)
                correct += (preds == labels).sum().item()
                total += inputs.size(0)
            
            return total_loss / total, correct / total
        
        else:
            # 纯NumPy训练（简化版）
            total_loss = 0.0
            correct = 0
            total = 0
            
            for i in range(0, len(train_loader['X']), self.config['batch_size']):
                X_batch = train_loader['X'][i:i+self.config['batch_size']]
                y_batch = train_loader['y'][i:i+self.config['batch_size']]
                
                probs = self.model.forward(X_batch)
                preds = np.argmax(probs, axis=1)
                
                # 计算损失（交叉熵）
                log_probs = -np.log(probs[np.arange(len(y_batch)), y_batch] + 1e-10)
                loss = np.mean(log_probs)
                total_loss += loss * len(X_batch)
                
                correct += np.sum(preds == y_batch)
                total += len(X_batch)
            
            return total_loss / total, correct / total
    
    def evaluate(self, val_loader):
        """评估模型"""
        if TORCH_AVAILABLE:
            self.model.eval()
            total_loss = 0.0
            correct = 0
            total = 0
            
            with torch.no_grad():
                for batch in val_loader:
                    inputs, labels = batch
                    inputs, labels = inputs.to(self.device), labels.to(self.device)
                    
                    outputs = self.model(inputs)
                    loss = self.criterion(outputs, labels)
                    
                    total_loss += loss.item() * inputs.size(0)
                    _, preds = torch.max(outputs, 1)
                    correct += (preds == labels).sum().item()
                    total += inputs.size(0)
            
            return total_loss / total, correct / total
        
        else:
            probs = self.model.forward(val_loader['X'])
            preds = np.argmax(probs, axis=1)
            
            log_probs = -np.log(probs[np.arange(len(val_loader['y'])), val_loader['y']] + 1e-10)
            loss = np.mean(log_probs)
            acc = np.mean(preds == val_loader['y'])
            
            return loss, acc
    
    def train(self, train_data, val_data):
        """完整训练流程"""
        print(f"开始训练，设备: {self.device}")
        print("=" * 50)
        
        if TORCH_AVAILABLE:
            train_tensor = torch.tensor(train_data['X'], dtype=torch.long)
            train_labels = torch.tensor(train_data['y'], dtype=torch.long)
            val_tensor = torch.tensor(val_data['X'], dtype=torch.long)
            val_labels = torch.tensor(val_data['y'], dtype=torch.long)
            
            train_dataset = torch.utils.data.TensorDataset(train_tensor, train_labels)
            val_dataset = torch.utils.data.TensorDataset(val_tensor, val_labels)
            
            train_loader = DataLoader(train_dataset, batch_size=self.config['batch_size'], shuffle=True)
            val_loader = DataLoader(val_dataset, batch_size=self.config['batch_size'])
        
        else:
            train_loader = train_data
            val_loader = val_data
        
        best_val_acc = 0.0
        
        for epoch in range(self.config['epochs']):
            train_loss, train_acc = self.train_epoch(train_loader)
            val_loss, val_acc = self.evaluate(val_loader)
            
            if TORCH_AVAILABLE:
                self.scheduler.step()
            
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_acc'].append(val_acc)
            
            print(f"Epoch {epoch+1:2d}/{self.config['epochs']}")
            print(f"  训练损失: {train_loss:.4f} | 训练准确率: {train_acc:.4f}")
            print(f"  验证损失: {val_loss:.4f} | 验证准确率: {val_acc:.4f}")
            
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                self.save_model('best_model.pth')
            
            print("-" * 50)
        
        print(f"训练完成！最佳验证准确率: {best_val_acc:.4f}")
        return self.history
    
    def save_model(self, path):
        """保存模型"""
        if TORCH_AVAILABLE:
            torch.save({
                'model_state_dict': self.model.state_dict(),
                'config': self.config,
                'history': self.history,
            }, path)
            print(f"模型已保存到 {path}")
        else:
            model_data = {
                'W_emb': self.model.W_emb.tolist(),
                'W_lstm': self.model.W_lstm.tolist(),
                'W_fc': self.model.W_fc.tolist(),
                'b_fc': self.model.b_fc.tolist(),
                'config': self.config,
                'history': self.history,
            }
            with open(path.replace('.pth', '.json'), 'w', encoding='utf-8') as f:
                json.dump(model_data, f, ensure_ascii=False, indent=2)
            print(f"模型已保存到 {path.replace('.pth', '.json')}")

# ==================== 评估指标 ====================
def calculate_metrics(true_labels, pred_labels):
    """计算评估指标"""
    metrics = {
        'accuracy': accuracy_score(true_labels, pred_labels),
        'precision': precision_score(true_labels, pred_labels, average='macro', zero_division=0),
        'recall': recall_score(true_labels, pred_labels, average='macro', zero_division=0),
        'f1': f1_score(true_labels, pred_labels, average='macro'),
    }
    return metrics

# ==================== 主函数 ====================
def main():
    print("=" * 60)
    print("      国风AI文化助手 - 训练脚本")
    print("=" * 60)
    
    # 1. 数据准备
    print("\n[1/5] 准备数据集...")
    dataset = CulturalDataset()
    data_splits = dataset.split_data()
    
    print(f"  词汇表大小: {len(dataset.vocab)}")
    print(f"  类别数量: {len(dataset.label_map)}")
    print(f"  训练集: {len(data_splits['train']['X'])} 样本")
    print(f"  验证集: {len(data_splits['val']['X'])} 样本")
    print(f"  测试集: {len(data_splits['test']['X'])} 样本")
    
    # 2. 创建模型
    print("\n[2/5] 创建模型...")
    vocab_size = len(dataset.vocab)
    
    if TORCH_AVAILABLE:
        model = CulturalModel(
            vocab_size=vocab_size,
            embedding_dim=CONFIG['embedding_dim'],
            hidden_dim=CONFIG['hidden_dim'],
            num_classes=CONFIG['num_classes']
        )
        print(f"  模型架构: CulturalModel (PyTorch)")
    else:
        model = NumPyModel(
            vocab_size=vocab_size,
            embedding_dim=CONFIG['embedding_dim'],
            hidden_dim=CONFIG['hidden_dim'],
            num_classes=CONFIG['num_classes']
        )
        print(f"  模型架构: NumPyModel (纯NumPy)")
    
    # 3. 训练模型
    print("\n[3/5] 开始训练...")
    trainer = Trainer(model, CONFIG)
    history = trainer.train(data_splits['train'], data_splits['val'])
    
    # 4. 测试评估
    print("\n[4/5] 测试评估...")
    if TORCH_AVAILABLE:
        test_tensor = torch.tensor(data_splits['test']['X'], dtype=torch.long)
        test_labels = torch.tensor(data_splits['test']['y'], dtype=torch.long)
        test_dataset = torch.utils.data.TensorDataset(test_tensor, test_labels)
        test_loader = DataLoader(test_dataset, batch_size=CONFIG['batch_size'])
        
        model.eval()
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for batch in test_loader:
                inputs, labels = batch
                inputs = inputs.to(trainer.device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.numpy())
    
    else:
        probs = model.forward(data_splits['test']['X'])
        all_preds = np.argmax(probs, axis=1)
        all_labels = data_splits['test']['y']
    
    metrics = calculate_metrics(all_labels, all_preds)
    
    print("\n测试集评估结果:")
    print("-" * 30)
    print(f"准确率 (Accuracy): {metrics['accuracy']:.4f}")
    print(f"精确率 (Precision): {metrics['precision']:.4f}")
    print(f"召回率 (Recall): {metrics['recall']:.4f}")
    print(f"F1分数 (F1 Score): {metrics['f1']:.4f}")
    
    # 5. 保存结果
    print("\n[5/5] 保存结果...")
    results = {
        'config': CONFIG,
        'metrics': metrics,
        'history': history,
        'label_map': dataset.label_map,
        'vocab_size': len(dataset.vocab),
    }
    
    with open('training_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("  训练结果已保存到 training_results.json")
    
    print("\n" + "=" * 60)
    print("         训练流程完成！")
    print("=" * 60)

if __name__ == '__main__':
    main()
