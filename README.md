# 国风解谜闯关游戏

一款融合中国传统文化的趣味闯关游戏，包含诗词文脉、非遗工艺、传统民俗、古典纹样、传统器物、新疆风情六大章节。

## 🎮 游戏特色

- 🏛️ 六大闯关章节，174道精心设计的题目
- 🎨 中国风视觉设计，优雅的配色方案
- 📱 响应式布局，支持手机和电脑
- 🔐 用户登录系统，保存游戏进度
- 🤖 AI智能提示助手
- 📊 积分系统和连续闯关记录

## 🚀 快速开始

### 方法一：本地运行

```bash
# 进入项目目录
cd 闯关小游戏

# 启动HTTP服务器
python -m http.server 8000

# 打开浏览器访问
# http://localhost:8000
```

### 方法二：GitHub Pages部署

1. 在GitHub创建名为 `guofeng-game` 的仓库
2. 上传所有文件到仓库
3. 在仓库设置中开启GitHub Pages
4. 访问地址：`https://your-username.github.io/guofeng-game/`

### 方法三：Netlify一键部署

1. 访问 https://app.netlify.com/drop
2. 拖拽项目文件夹到页面
3. 自动生成公网链接

## 📁 项目结构

```
.
├── index.html          # 主页面
├── style.css           # 样式文件
├── game.js             # 游戏逻辑
├── .github/workflows/deploy.yml  # GitHub Actions配置
├── .gitignore          # Git忽略配置
└── README.md           # 项目说明
```

## 🎯 默认账号

- **用户名**: player
- **密码**: 123456

## 📚 章节内容

| 章节 | 题目数量 |
|------|---------|
| 诗词文脉 | 33 |
| 非遗工艺 | 27 |
| 传统民俗 | 32 |
| 古典纹样 | 27 |
| 传统器物 | 30 |
| 新疆风情 | 25 |

## 🛠️ 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage (数据持久化)

## 📄 License

MIT License
