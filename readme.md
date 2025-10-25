# 🎵 东方音乐搜寻插件 - 让哥哥找音乐找到腿软~ ✨

<div align="center">

![东方Project](https://img.shields.io/badge/东方Project-音乐搜索-red?style=for-the-badge&logo=music)
![版本](https://img.shields.io/badge/version-1.0.0-pink?style=for-the-badge)
![许可证](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)

**呐呐~ 哥哥想听东方的曲子吗? 人家帮你找哦~ (///▽///) 💕**

[开始使用](#-快速开始人家要手把手教哥哥哦) · [功能介绍](#-核心功能让哥哥爽到起飞) · [示例](#-使用示例哥哥快看) · [支持我们](#-支持我们给人家点个-star-嘛)

</div>

---

## 💖 这是什么东西啦~

嘿嘿~ 这可是人家精心准备的**东方Project音乐搜索插件**哦! 专门为Yunzai-Bot框架开发的,能帮哥哥快速找到想听的东方同人音乐~ 

不管是THBWiki的海量曲库,还是Thdisc的本地收藏,甚至是车万云音乐的详细数据,人家都能帮哥哥翻个底朝天! (๑•̀ㅂ•́)و✧

> **小声BB:** 据说用了这个插件的哥哥,每天都沉浸在东方的美妙音乐中无法自拔呢~ 嘻嘻,人家可不负责哦! 😈

---

## 🌟 核心功能(让哥哥爽到起飞!)

### 🎼 三重数据源融合搜索
人家可厉害了! 同时搜索**三个**数据源哦:

1. **THBWiki API** - 最权威的东方维基百科,专辑、曲目、社团信息应有尽有~
2. **Thdisc本地数据** - 哥哥本地的音乐目录树,想找本地文件? 包在人家身上!
3. **车万云音乐数据** - 超详细的曲目信息,连作曲家、相关角色都有哦! ✨

> 💡 **设计思路:** 人家采用的是`Promise.all`并行搜索策略,三个数据源同时查询,速度快得飞起~ 哥哥再也不用等了! (≧∇≦)

### 🔍 智能匹配算法
人家的匹配算法可聪明了! 不是简单的字符串包含哦~

```javascript
// 人家给不同字段设置了权重呢! 
原曲名: ★★★★★★★★★★ (权重10)
别名: ★★★★★★★★★ (权重9)
专辑名: ★★★★★★★★ (权重8)
使用场景: ★★★★★★★ (权重7)
// ... 还有更多!
```

- ✅ **完全匹配**: 额外加2倍权重! 
- ✅ **开头匹配**: 额外加1倍权重!
- ✅ **包含匹配**: 基础权重!

结果会按照匹配度从高到低排序,最相关的当然要给哥哥最先看啦~ ⭐⭐⭐⭐⭐

### 📊 详细的专辑信息展示
想知道一张专辑的详情? 交给人家!

- 🏷️ 社团名称
- 🎪 发行展会(C92、例大祭etc.)
- 📅 发行日期
- 🎵 音轨数量和总时长
- 🎨 音乐风格分类
- 🎼 完整曲目列表(含原曲、编曲、时长)

> **小贴士:** 使用 `#th详情 专辑名` 就能看到超详细的信息哦! 人家还会贴心地分多条消息发送,再长的列表也不怕刷屏~ (˶‾᷄ ⁻̫ ‾᷅˶)

### 🎲 随机推荐系统
不知道听什么? 让人家给哥哥随机推荐一张专辑吧!

```
#th随机
```

每次都是不同的惊喜哦~ 说不定能发现宝藏专辑呢! 💎

---

## 🚀 快速开始(人家要手把手教哥哥哦!)

### 📋 前置条件

- **Yunzai-Bot** 已安装并运行中
- **Node.js** 版本 >= 14.0.0
- 一颗想听东方音乐的心 💕

### 📥 安装步骤

#### 方法一: Git克隆(推荐给会git的哥哥~)

```bash
# 进入Yunzai的插件目录
cd Yunzai-Bot/plugins

# 克隆人家的仓库~
git clone https://github.com/你的用户名/touhou-music-search.git ceshiing

# 准备数据文件(重要!)
cd ceshiing
# 将你的 musicdate.txt 和 touhoumusic.json 放到这个目录
```

#### 方法二: 直接下载(给不会git的哥哥准备的!)

1. 点击右上角绿色的 `Code` 按钮
2. 选择 `Download ZIP`
3. 解压到 `Yunzai-Bot/plugins/ceshiing` 目录
4. 放入数据文件就好啦~

### 📁 数据文件准备

人家需要两个数据文件哦:

#### 1️⃣ `musicdate.txt` - Thdisc目录树文件

这是你本地音乐库的目录结构,格式像这样:

```
.
├── [魂音泉]
│   ├── 2016.10.16 [TOS-035] ANOTHER LINE EP [秋例大祭3]
│   └── 2016.12.29 [TOS-036] 魂音泉 空オーケストラ ～たまオケ～ 3 [C91]
├── [Alstroemeria Records]
│   └── 2015.12.30 POP│CULTURE 5 [C89]
└── [森罗万象]
    └── 2019.05.05 インフェルノシティ [例大祭16]
```

> 💡 **小提示:** 可以用 `tree` 命令生成哦! 
> ```bash
> tree /your/music/path > musicdate.txt
> ```

#### 2️⃣ `touhoumusic.json` - 车万云音乐数据

JSON格式的详细曲目信息数组:

```json
[
  {
    "序号": "1",
    "发布日期": "1996-08-11 00:00:00",
    "专辑名": "東方靈異伝 ～ Highly Responsive to Prayers.",
    "原曲名": "A Sacred Lot",
    "作曲家": "ZUN",
    "使用场景等信息": "主题曲",
    "相关角色": "博丽灵梦"
  }
]
```

### 🎉 启动插件

数据文件准备好后,重启Yunzai-Bot:

```bash
# 在Yunzai根目录执行
npm start
```

看到这样的日志就成功啦:

```
[东方音乐搜寻] 插件加载完成,已加载 1234 条Thdisc数据,5678 条车万云音乐数据
```

---

## 📖 使用示例(哥哥快看!)

### 🎵 搜索歌曲

```
#th搜歌 反则的八音盒
```

**人家会返回:**
- THBWiki的曲目匹配结果
- Thdisc本地专辑匹配结果  
- 车万云音乐的详细信息(带匹配度星级!)

<details>
<summary>点击查看返回示例 (哥哥点这里~)</summary>

```
🔍 搜索关键词: "反则的八音盒"
📊 总计找到 15 条相关结果
💡 提示: 匹配度 ★ 越多表示与关键词越相关

--- THBWiki找到 5 首包含"反则的八音盒"的歌曲 ---

1. 反則の八音盒
   专辑: 幻想郷茶房
   社团: Alstroemeria Records
   💡 使用 #th详情 "幻想郷茶房" 查看专辑信息

--- 车万云音乐数据找到 3 首相关歌曲 ---

1. 【匹配度: ★★★★★】
📝 序号: 1234
📅 发布日期: 2015-12-30
💿 专辑名: POP│CULTURE 5
🎵 原曲名: ティアオイエツォン(withered leaf)
🎹 作曲家: Masayoshi Minoshima
🏷️ 使用场景: 东方妖妖梦
```

</details>

### 💿 搜索专辑

```
#th搜专 幻想郷茶房
```

同时搜索Thdisc和THBWiki的专辑信息!

### 🎪 搜索社团

```
#th搜社 魂音泉
```

列出该社团的所有专辑~

### 🎭 搜索展会作品

```
#th搜展 C92
```

找出某个展会(如C92、例大祭16)的所有发行作品!

### 📋 查看专辑详情

```
#th详情 POP│CULTURE 5
```

**超详细的信息包括:**
- 完整曲目列表
- 每首曲子的原曲、编曲、时长
- 专辑总时长和音轨数
- 社团、展会、发行日期等元信息

### 🎲 随机推荐

```
#th随机
```

人家随机给哥哥推荐一张专辑~ 每次都不一样哦!

### 📊 查看统计

```
#th统计
```

看看人家帮哥哥收录了多少数据~

### 🔄 重载数据

```
#th重载
```

更新了数据文件? 不用重启Bot,直接重载就好!

### ❓ 查看帮助

```
#th帮助
```

忘记命令了? 人家随时提醒哥哥~ (◍•ᴗ•◍)

---

## 🎨 技术特色(给技术宅哥哥看的!)

### 🔧 代码架构

```
EnhancedTouhouMusicSearch (主类)
├── 数据加载模块
│   ├── loadThdiscData() - 解析目录树
│   └── loadChewanMusicData() - 加载JSON
├── 搜索引擎
│   ├── searchTHBWikiAlbum() - API搜索
│   ├── searchTHBWikiTrack() - 曲目搜索
│   ├── searchThdisc() - 本地目录搜索
│   └── searchChewanMusic() - 智能匹配搜索
├── 消息处理
│   ├── sendForwardMessage() - 转发消息
│   └── fallbackToText() - 降级文本发送
└── 工具函数
    ├── calculateMatchScore() - 匹配度计算
    ├── parseTreeStructure() - 树形结构解析
    └── extractXXX() - 信息提取系列
```

### 💪 核心优势

#### 1. 并行搜索策略
使用`Promise.all`同时查询三个数据源,响应速度快3倍!

```javascript
const [thbResults, thdiscResults, chewanResults] = await Promise.all([
    this.searchTHBWikiTrack(keyword),
    this.searchThdiscSong(keyword),
    this.searchChewanMusic(keyword)
]);
```

#### 2. 智能容错机制
- 转发消息失败? 自动降级为普通文本!
- 消息过长? 自动分段发送!
- API超时? 不影响其他数据源!

#### 3. 灵活的目录树解析
支持各种格式的tree输出,自动识别:
- 社团名 (用`[]`包裹)
- 发行日期 (YYYY.MM.DD 或 YYYY-MM-DD)
- 展会信息 (C92、例大祭16、M3-XX等)
- 编号信息 ([TOS-035]等)

#### 4. 权重化匹配算法
不同字段不同权重,完全匹配额外加分,确保最相关结果排在最前!

#### 5. 内存优化
- 数据按需加载
- 搜索结果限制数量(`maxResults`)
- 长文本智能分割

---

## 🎯 命令速查表

| 命令 | 说明 | 示例 |
|------|------|------|
| `#th搜歌 <关键词>` | 搜索歌曲 | `#th搜歌 反则的八音盒` |
| `#th搜专 <关键词>` | 搜索专辑 | `#th搜专 幻想郷茶房` |
| `#th搜社 <关键词>` | 搜索社团 | `#th搜社 魂音泉` |
| `#th搜展 <关键词>` | 搜索展会 | `#th搜展 C92` |
| `#th详情 <专辑名>` | 查看专辑详情 | `#th详情 POP│CULTURE 5` |
| `#th随机` | 随机推荐专辑 | `#th随机` |
| `#th统计` | 查看统计信息 | `#th统计` |
| `#th重载` | 重新加载数据 | `#th重载` |
| `#th帮助` | 显示帮助 | `#th帮助` |

> 💡 **小提示:** 所有命令都支持英文别名哦! 比如 `#th song`、`#th album`、`#th random` 等~

---

## 🛠️ 配置说明

插件的配置在构造函数中,可以根据需要修改:

```javascript
this.config = {
    dataFile: 'plugins/ceshiing/musicdate.txt',        // Thdisc数据文件路径
    chewanMusicFile: 'plugins/ceshiing/touhoumusic.json', // 车万云音乐数据路径
    thbWikiAPI: 'https://thwiki.cc/album.php',         // THBWiki API地址
    maxResults: 5,                                      // 最大返回结果数
    latestCount: 5,                                     // 最新专辑显示数量
};
```

---

## 📚 数据来源说明

### THBWiki
- **官网:** [https://thwiki.cc/](https://thwiki.cc/)
- **API文档:** [THBWiki API](https://thwiki.cc/api.php)
- 东方Project最权威的中文Wiki,数据最全面!

### Thdisc
- **官网:** [http://thdisc.jiocity.com/](http://thdisc.jiocity.com/)
- 著名的东方同人音乐收录站点
- 需要自己生成本地目录树文件

### 车万云音乐
- 社区整理的详细曲目信息数据库
- 包含原曲、作曲家、角色等详细元数据

---

## 🐛 常见问题

<details>
<summary><b>Q: 为什么搜索没有结果?</b></summary>

A: 检查以下几点:
1. 数据文件是否正确放置在插件目录
2. 数据文件格式是否正确
3. THBWiki API是否可以访问(检查网络)
4. 使用 `#th统计` 查看已加载的数据量

</details>

<details>
<summary><b>Q: 为什么转发消息发送失败?</b></summary>

A: 人家已经做了降级处理哦! 转发失败会自动改成普通文本消息发送,哥哥不用担心~

</details>

<details>
<summary><b>Q: 可以修改最大返回结果数吗?</b></summary>

A: 当然可以! 修改代码中的 `maxResults` 配置项就好~
```javascript
maxResults: 10,  // 改成10条
```

</details>

<details>
<summary><b>Q: 支持模糊搜索吗?</b></summary>

A: 当然支持! 人家的搜索本来就是模糊匹配,而且还有智能权重排序呢~

</details>

<details>
<summary><b>Q: 数据更新了怎么办?</b></summary>

A: 替换数据文件后,使用 `#th重载` 命令就可以了,不需要重启Bot哦!

</details>

---

## 🎁 支持我们(给人家点个 Star 嘛~)

如果哥哥觉得这个插件好用的话... 

- ⭐ 给我们的仓库点个Star吧! (人家会很开心的!)
- 🐛 发现Bug? 欢迎提Issue!
- 💡 有好的想法? 欢迎提PR!
- 💖 分享给其他喜欢东方的朋友~

---

## 🔗 相关链接

- [东方Project官网](https://www16.big.or.jp/~zun/) - ZUN神主的官网
- [THBWiki](https://thwiki.cc/) - 东方维基百科
- [Thdisc](http://thdisc.jiocity.com/) - 东方同人音乐收录站
- [Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot) - 强大的QQ机器人框架
- [东方吧](https://tieba.baidu.com/f?kw=%E4%B8%9C%E6%96%B9) - 百度贴吧东方交流区
- [THBGames](https://www.thpatch.net/) - 东方补丁站

### 🎵 在线听歌传送门
- [网易云音乐 - 东方专区](https://music.163.com/#/search/m/?s=%E4%B8%9C%E6%96%B9&type=1)
- [Bilibili - 东方音乐](https://www.bilibili.com/v/music/touhou/)
- [SoundCloud - Touhou](https://soundcloud.com/search?q=touhou)

---

## 📜 开源协议

本项目采用 **MIT** 协议开源~

```
MIT License

Copyright (c) 2025 东方音乐搜寻插件开发组

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👥 贡献者

感谢所有为这个项目做出贡献的哥哥们! 💕

<!-- 这里可以自动生成贡献者列表 -->
<a href="https://github.com/你的用户名/touhou-music-search/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=你的用户名/touhou-music-search" />
</a>

---

## 📮 联系我们

- **Issues:** [GitHub Issues](https://github.com/你的用户名/touhou-music-search/issues)
- **Discussions:** [GitHub Discussions](https://github.com/你的用户名/touhou-music-search/discussions)
- **QQ群:** 待建立~ (哥哥想加入吗?)

---

## 💝 特别鸣谢

- 感谢 **ZUN神主** 创造了东方Project这个美妙的世界
- 感谢 **THBWiki** 团队维护的详细数据库
- 感谢 **Thdisc** 提供的音乐收录服务
- 感谢所有东方同人音乐创作者们的精彩作品
- 感谢 **Yunzai-Bot** 提供的优秀框架
- 感谢每一位使用和支持这个插件的哥哥~ 💖

---

<div align="center">

### 🌸 让我们一起在东方的音乐海洋中遨游吧! 🌸

**Made with 💕 by 东方音乐爱好者**

*最后更新: 2025年10月25日 - 苦逼高一学生制作 (哥哥要多多支持人家哦! >.<)*

</div>

---

## 🎮 彩蛋

看到这里的哥哥都是真爱! 人家悄悄告诉你一个小秘密...

<details>
<summary>点击揭晓神秘彩蛋! (づ ●─● )づ</summary>

<br>

其实... 人家最喜欢的东方角色是 **博丽灵梦** 哦! 

因为她总是一副"好麻烦啊"的样子,但关键时刻还是会出手解决异变~

就像人家这个插件一样,看起来很调皮,但其实超级好用对吧? ✨

**彩蛋命令:** 试试输入 `#th灵梦赛高` 看看会发生什么? (开个玩笑啦~ 这个命令不存在的~ 但是哥哥可以自己加上哦!)

不过说真的,如果哥哥真的喜欢这个插件,记得给人家点个Star哦! 

人家会超级超级开心的! (๑>ᴗ<๑) 💕💕💕

</details>

---

**⚠️ 免责声明:** 本插件仅供学习交流使用,所有音乐版权归原作者所有。请支持正版,支持东方Project同人音乐创作者~ ♪(^∇^*)
