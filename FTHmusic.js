import plugin from '../../lib/plugins/plugin.js';
import fs from 'fs';
import path from 'path';

export class EnhancedTouhouMusicSearch extends plugin {
    constructor() {
        super({
            name: '东方音乐搜寻',
            dsc: 'Thdisc数据 + 车万云音乐数据 + THBWiki API融合插件',
            event: 'message',
            priority: 5000,
            rule: [
                { reg: '^#th\\s*(搜|搜索|search)\\s+.*', fnc: 'globalSearch' },
                { reg: '^#th\\s*(搜歌|搜曲|搜索歌曲|song)\\s+.*', fnc: 'searchSong' },
                { reg: '^#th\\s*(搜专|搜索专辑|album)\\s+.*', fnc: 'searchAlbum' },
                { reg: '^#th\\s*(搜社|搜索社团|group)\\s+.*', fnc: 'searchGroup' },
                { reg: '^#th\\s*(搜展|搜索展会|event)\\s+.*', fnc: 'searchEvent' },
                { reg: '^#th\\s*(详情|详细信息|detail)\\s+.*', fnc: 'getAlbumDetail' },
                { reg: '^#th\\s*(随机专辑|随机|random)\\s*.*', fnc: 'randomAlbum' },
                { reg: '^#th\\s*(统计|目录统计|stats)\\s*$', fnc: 'showStats' },
                { reg: '^#th\\s*(帮助|help|音乐帮助)\\s*$', fnc: 'showHelp' },
                { reg: '^#th\\s*(重载|刷新|reload)\\s*$', fnc: 'reloadData' }
            ]
        });

        this.config = {
            dataFile: path.join(process.cwd(), 'plugins/ceshiing/musicdate.txt'),
            chewanMusicFile: path.join(process.cwd(), 'plugins/ceshiing/touhoumusic.json'),
            thbWikiAPI: 'https://thwiki.cc/album.php',
            maxResults: 5,
            latestCount: 5,
        };

        this.thdiscData = [];
        this.chewanMusicData = [];
        this.loadThdiscData();
        this.loadChewanMusicData();
        logger.mark(`[东方音乐搜寻] 插件加载完成,已加载 ${this.thdiscData.length} 条Thdisc数据,${this.chewanMusicData.length} 条车万云音乐数据`);
    }

    // ========== 新增全局搜索功能 ==========

    async globalSearch(e) {
        const keyword = e.msg.replace(/^#th\s*(?:搜|搜索|search)\s+/, '').trim();
        
        if (!keyword) {
            const nodes = [
                this.createForwardContent("请在命令后提供搜索关键词,例如:\n#th搜 坂东的八音盒\n#th搜 魂音泉\n#th搜 C92")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        try {
            await e.reply(`🔍 正在全局搜索"${keyword}"...`);

            // 并行搜索所有数据源
            const [thbTrackResults, thbAlbumResults, thdiscResults, chewanResults] = await Promise.all([
                this.searchTHBWikiTrack(keyword),
                this.searchTHBWikiAlbum(keyword, true),
                this.searchThdisc(keyword),
                this.searchChewanMusic(keyword)
            ]);

            const nodes = [];
            let totalResults = 0;

            // 统计总结果数
            totalResults += (thbTrackResults ? thbTrackResults.length : 0);
            totalResults += (thbAlbumResults ? thbAlbumResults.length : 0);
            totalResults += thdiscResults.length;
            totalResults += chewanResults.length;

            if (totalResults === 0) {
                nodes.push(this.createForwardContent(`❌ 未找到包含"${keyword}"的任何相关信息`));
            } else {
                // 添加搜索总览
                nodes.push(this.createForwardContent(
                    `🎯 全局搜索结果: "${keyword}"\n\n` +
                    `📊 共找到 ${totalResults} 条相关信息:\n` +
                    `  🎵 THBWiki歌曲: ${thbTrackResults ? thbTrackResults.length : 0} 首\n` +
                    `  💿 THBWiki专辑: ${thbAlbumResults ? thbAlbumResults.length : 0} 张\n` +
                    `  💽 Thdisc数据: ${thdiscResults.length} 条\n` +
                    `  ☁️ 车万云音乐: ${chewanResults.length} 首\n\n` +
                    `💡 以下按数据源分类展示结果`
                ));

                // 1. THBWiki歌曲结果
                if (thbTrackResults && thbTrackResults.length > 0) {
                    nodes.push(this.createForwardContent(
                        `━━━━━━━━━━━━━━━━\n` +
                        `📌 【THBWiki歌曲】找到 ${thbTrackResults.length} 首\n` +
                        `━━━━━━━━━━━━━━━━`
                    ));

                    thbTrackResults.slice(0, this.config.maxResults).forEach((track, index) => {
                        nodes.push(this.createForwardContent(
                            `${index + 1}. 🎵 ${track.name}\n` +
                            `   📀 专辑: ${track.album}\n` +
                            (track.circle ? `   🎪 社团: ${track.circle}\n` : '') +
                            `   🔖 来源: THBWiki曲目数据库\n` +
                            `   💡 使用 #th详情 "${track.album}" 查看专辑信息`
                        ));
                    });

                    if (thbTrackResults.length > this.config.maxResults) {
                        nodes.push(this.createForwardContent(
                            `... 还有 ${thbTrackResults.length - this.config.maxResults} 首歌曲未显示`
                        ));
                    }
                }

                // 2. THBWiki专辑结果
                if (thbAlbumResults && thbAlbumResults.length > 0) {
                    nodes.push(this.createForwardContent(
                        `━━━━━━━━━━━━━━━━\n` +
                        `📌 【THBWiki专辑】找到 ${thbAlbumResults.length} 张\n` +
                        `━━━━━━━━━━━━━━━━`
                    ));

                    thbAlbumResults.slice(0, this.config.maxResults).forEach((album, index) => {
                        nodes.push(this.createForwardContent(
                            `${index + 1}. 💿 ${album.name}\n` +
                            (album.circle ? `   🎪 社团: ${album.circle}\n` : '') +
                            `   🔖 来源: THBWiki专辑数据库\n` +
                            `   💡 使用 #th详情 "${album.name}" 查看详细信息`
                        ));
                    });

                    if (thbAlbumResults.length > this.config.maxResults) {
                        nodes.push(this.createForwardContent(
                            `... 还有 ${thbAlbumResults.length - this.config.maxResults} 张专辑未显示`
                        ));
                    }
                }

                // 3. Thdisc本地数据结果
                if (thdiscResults.length > 0) {
                    nodes.push(this.createForwardContent(
                        `━━━━━━━━━━━━━━━━\n` +
                        `📌 【Thdisc本地数据】找到 ${thdiscResults.length} 条\n` +
                        `━━━━━━━━━━━━━━━━`
                    ));

                    thdiscResults.slice(0, this.config.maxResults).forEach((item, index) => {
                        nodes.push(this.createForwardContent(
                            `${index + 1}. 💽 ${item.name}\n` +
                            (item.group ? `   🎪 社团: ${item.group}\n` : '') +
                            (item.date ? `   📅 日期: ${item.date}\n` : '') +
                            (item.event ? `   🎊 展会: ${item.event}\n` : '') +
                            `   📂 路径: ${item.path}\n` +
                            `   🔖 来源: Thdisc本地目录`
                        ));
                    });

                    if (thdiscResults.length > this.config.maxResults) {
                        nodes.push(this.createForwardContent(
                            `... 还有 ${thdiscResults.length - this.config.maxResults} 条记录未显示`
                        ));
                    }
                }

                // 4. 车万云音乐数据结果
                if (chewanResults.length > 0) {
                    const sortedResults = chewanResults.sort((a, b) => b.score - a.score);
                    
                    nodes.push(this.createForwardContent(
                        `━━━━━━━━━━━━━━━━\n` +
                        `📌 【车万云音乐数据】找到 ${chewanResults.length} 首\n` +
                        `━━━━━━━━━━━━━━━━`
                    ));

                    sortedResults.slice(0, this.config.maxResults).forEach((result, index) => {
                        const song = result.item;
                        const matchScore = this.getMatchStars(result.score);
                        
                        const songInfo = [
                            `${index + 1}. 🎵 ${song.原曲名 || '未知'} 【匹配度: ${matchScore}】`,
                            `   🎹 作曲家: ${song.作曲家 || '未知'}`,
                            `   💿 专辑名: ${song.专辑名 || '未知'}`,
                            `   📅 发布日期: ${song.发布日期 ? song.发布日期.split(' ')[0] : '未知'}`,
                            song.别名 ? `   📌 别名: ${song.别名}` : null,
                            `   🏷️ 使用场景: ${song.使用场景等信息 || '未知'}`,
                            song.相关角色 ? `   👤 相关角色: ${song.相关角色}` : null,
                            `   🔖 来源: 车万云音乐数据库`
                        ].filter(line => line !== null).join('\n');

                        nodes.push(this.createForwardContent(songInfo));
                    });

                    if (chewanResults.length > this.config.maxResults) {
                        nodes.push(this.createForwardContent(
                            `... 还有 ${chewanResults.length - this.config.maxResults} 首歌曲未显示`
                        ));
                    }
                }

                // 添加搜索提示
                nodes.push(this.createForwardContent(
                    `━━━━━━━━━━━━━━━━\n` +
                    `📖 搜索提示:\n\n` +
                    `• 使用 #th搜歌 <关键词> 仅搜索歌曲\n` +
                    `• 使用 #th搜专 <关键词> 仅搜索专辑\n` +
                    `• 使用 #th搜社 <关键词> 仅搜索社团\n` +
                    `• 使用 #th搜展 <关键词> 仅搜索展会\n` +
                    `• 使用 #th详情 <专辑名> 查看详细信息\n\n` +
                    `⭐ 匹配度星级说明:\n` +
                    `★★★★★ = 完全匹配\n` +
                    `★★★☆☆ = 部分匹配\n` +
                    `★☆☆☆☆ = 弱相关`
                ));
            }

            await this.sendForwardMessage(e, nodes);
            
        } catch (error) {
            logger.error(`[全局搜索失败] ${error}`);
            const nodes = [
                this.createForwardContent("❌ 搜索失败,请检查网络连接或稍后重试")
            ];
            await this.sendForwardMessage(e, nodes);
        }

        return true;
    }

    // ========== 修复转发消息方法 ==========

    createForwardContent(content, nickname = "博丽灵梦", user_id = "10001") {
        return {
            message: content,
            nickname: nickname,
            user_id: user_id
        };
    }

    async sendForwardMessage(e, nodes) {
        try {
            const forwardContent = nodes.map(node => ({
                message: node.message || node,
                nickname: node.nickname || "博丽灵梦",
                user_id: node.user_id || "1162077369"
            }));

            let forwardMsg;
            
            if (e.isGroup) {
                forwardMsg = await e.group.makeForwardMsg(forwardContent);
            } else {
                forwardMsg = await e.friend.makeForwardMsg(forwardContent);
            }

            await e.reply(forwardMsg);
            return true;
            
        } catch (error) {
            logger.error(`[发送转发消息失败] ${error}`);
            return await this.fallbackToText(e, nodes);
        }
    }

    async fallbackToText(e, nodes) {
        try {
            const textParts = [];
            
            for (const node of nodes) {
                let nickname = "博丽灵梦";
                let contentText = "";
                
                if (typeof node === 'string') {
                    contentText = node;
                } else if (node.message) {
                    contentText = node.message;
                    nickname = node.nickname || nickname;
                } else if (node.data && node.data.content) {
                    nickname = node.data.nickname || nickname;
                    if (Array.isArray(node.data.content)) {
                        node.data.content.forEach(item => {
                            if (item.type === 'text' && item.data && item.data.text) {
                                contentText += item.data.text;
                            }
                        });
                    }
                }
                
                if (contentText.trim()) {
                    textParts.push(`【${nickname}】\n${contentText}`);
                }
            }
            
            if (textParts.length > 0) {
                const finalText = textParts.join('\n\n');
                if (finalText.length > 1000) {
                    const chunks = this.splitText(finalText, 1000);
                    for (const chunk of chunks) {
                        await e.reply(chunk);
                    }
                } else {
                    await e.reply(finalText);
                }
                return true;
            } else {
                await e.reply('消息内容为空');
                return false;
            }
        } catch (error) {
            logger.error(`[降级文本发送也失败] ${error}`);
            await e.reply('消息发送失败,请稍后重试');
            return false;
        }
    }

    splitText(text, maxLength) {
        const chunks = [];
        let currentChunk = '';
        
        const lines = text.split('\n');
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 <= maxLength) {
                currentChunk += (currentChunk ? '\n' : '') + line;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = line;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }

    // ========== 主要功能方法 ==========

    async showHelp(e) {
        const nodes = [
            this.createForwardContent("🎵 东方音乐搜寻 - 使用帮助"),
            this.createForwardContent(
                "【🆕 全局搜索】\n" +
                "#th搜 <关键词>  - 全局搜索(歌曲+专辑+社团+展会)\n\n" +
                "【🎯 精确搜索】\n" +
                "#th搜歌 <关键词>  - 搜索歌曲(Thdisc+车万云+THBWiki)\n" +
                "#th搜专 <关键词>  - 搜索专辑(Thdisc+THBWiki)\n" +
                "#th搜社 <关键词>  - 搜索THBWiki社团\n" +
                "#th搜展 <关键词>  - 搜索展会作品\n\n" +
                "【📖 其他功能】\n" +
                "#th详情 <专辑名> - 查看专辑详细信息\n" +
                "#th随机          - 随机推荐专辑\n" +
                "#th统计          - 统计信息\n" +
                "#th重载          - 重新加载数据\n" +
                "#th帮助          - 显示此帮助"
            ),
            this.createForwardContent(
                "【💡 使用示例】\n\n" +
                "全局搜索:\n" +
                "#th搜 坂东的八音盒\n" +
                "#th搜 魂音泉\n" +
                "#th搜 C92\n\n" +
                "精确搜索:\n" +
                "#th搜歌 坂东的八音盒\n" +
                "#th搜社 魂音泉\n" +
                "#th详情 POP|CULTURE 5\n" +
                "#th搜展 C92"
            )
        ];

        await this.sendForwardMessage(e, nodes);
        return true;
    }

    async reloadData(e) {
        this.loadThdiscData();
        this.loadChewanMusicData();
        const nodes = [
            this.createForwardContent(`✅ 数据重载完成!当前共加载 ${this.thdiscData.length} 条Thdisc数据,${this.chewanMusicData.length} 条车万云音乐数据`)
        ];
        await this.sendForwardMessage(e, nodes);
        return true;
    }

    async searchSong(e) {
        const keyword = e.msg.replace(/^#th\s*(?:搜歌|搜曲|搜索歌曲|song)\s+/, '').trim();
        
        if (!keyword) {
            const nodes = [
                this.createForwardContent("请在命令后提供歌曲关键词,例如:#th搜歌 坂东的八音盒")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        try {
            const [thbResults, thdiscResults, chewanResults] = await Promise.all([
                this.searchTHBWikiTrack(keyword),
                this.searchThdiscSong(keyword),
                this.searchChewanMusic(keyword)
            ]);

            const nodes = [];

            if (thbResults && thbResults.length > 0) {
                nodes.push(this.createForwardContent(
                    `🎵 THBWiki找到 ${thbResults.length} 首包含"${keyword}"的歌曲:\n\n` +
                    thbResults.slice(0, this.config.maxResults).map((track, index) => 
                        `${index + 1}. ${track.name}\n` +
                        `   专辑: ${track.album}\n` +
                        (track.circle ? `   社团: ${track.circle}\n` : '') +
                        `   💡 使用 #th详情 "${track.album}" 查看专辑信息`
                    ).join('\n\n')
                ));
            }

            if (thdiscResults.length > 0) {
                nodes.push(this.createForwardContent(
                    `💽 Thdisc数据找到 ${thdiscResults.length} 个相关专辑:\n\n` +
                    thdiscResults.slice(0, this.config.maxResults).map((item, index) => 
                        `${index + 1}. ${item.name}\n` +
                        (item.group ? `   社团: ${item.group}\n` : '') +
                        (item.date ? `   日期: ${item.date}\n` : '') +
                        `   路径: ${item.path}`
                    ).join('\n\n')
                ));
            }

            if (chewanResults.length > 0) {
                const sortedResults = chewanResults.sort((a, b) => b.score - a.score);
                
                nodes.push(this.createForwardContent(
                    `☁️ 车万云音乐数据找到 ${chewanResults.length} 首相关歌曲:`
                ));

                sortedResults.slice(0, this.config.maxResults).forEach((result, index) => {
                    const song = result.item;
                    const matchScore = this.getMatchStars(result.score);
                    
                    const songInfo = [
                        `${index + 1}. 【匹配度: ${matchScore}】`,
                        `🎼 序号: ${song.序号 || '未知'}`,
                        `📅 发布日期: ${song.发布日期 ? song.发布日期.split(' ')[0] : '未知'}`,
                        `💿 专辑名: ${song.专辑名 || '未知'}`,
                        `🎵 原曲名: ${song.原曲名 || '未知'}`,
                        song.别名 ? `📌 别名: ${song.别名}` : null,
                        `🎹 作曲家: ${song.作曲家 || '未知'}`,
                        song.编号 ? `🔢 编号: ${song.编号}` : null,
                        `🏷️ 使用场景: ${song.使用场景等信息 || '未知'}`,
                        song.相关角色 ? `👤 相关角色: ${song.相关角色}` : null,
                        song.形态 ? `📦 形态: ${song.形态}` : null,
                        song.歌曲名称读音 ? `🗣️ 读音: ${song.歌曲名称读音}` : null,
                        song.备注 ? `💬 备注: ${song.备注}` : null
                    ].filter(line => line !== null).join('\n');

                    nodes.push(this.createForwardContent(songInfo));
                });
            }

            if (nodes.length === 0) {
                nodes.push(this.createForwardContent(`❌ 未找到包含"${keyword}"的歌曲`));
            } else {
                const totalResults = 
                    (thbResults ? thbResults.length : 0) + 
                    thdiscResults.length + 
                    chewanResults.length;
                nodes.unshift(this.createForwardContent(
                    `🔍 搜索关键词: "${keyword}"\n` +
                    `📊 总计找到 ${totalResults} 条相关结果\n` +
                    `💡 提示: 匹配度 ★ 越多表示与关键词越相关`
                ));
            }

            await this.sendForwardMessage(e, nodes);
            
        } catch (error) {
            logger.error(`[搜索歌曲失败] ${error}`);
            const nodes = [
                this.createForwardContent("❌ 搜索失败,请检查网络连接或稍后重试")
            ];
            await this.sendForwardMessage(e, nodes);
        }

        return true;
    }

    async searchGroup(e) {
        const keyword = e.msg.replace(/^#th\s*(?:搜社|搜索社团|group)\s+/, '').trim();
        
        if (!keyword) {
            const nodes = [
                this.createForwardContent("请在命令后提供社团关键词,例如:#th搜社 魂音泉")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        try {
            const results = await this.searchTHBWikiAlbum(keyword, true);
            
            if (!results || results.length === 0) {
                const nodes = [
                    this.createForwardContent(`❌ 未在THBWiki中找到社团"${keyword}"的专辑`)
                ];
                await this.sendForwardMessage(e, nodes);
                return true;
            }

            const nodes = [
                this.createForwardContent(`🎪 找到社团"${keyword}"的 ${results.length} 张专辑`),
                ...results.slice(0, this.config.maxResults).map((album, index) => 
                    this.createForwardContent(
                        `${index + 1}. ${album.name}\n` +
                        (album.circle ? `   社团: ${album.circle}\n` : '') +
                        (album.date ? `   日期: ${album.date}\n` : '') +
                        `   💡 使用 #th详情 "${album.name}" 查看详细信息`
                    )
                )
            ];

            await this.sendForwardMessage(e, nodes);
            
        } catch (error) {
            logger.error(`[搜索社团失败] ${error}`);
            const nodes = [
                this.createForwardContent("❌ 搜索失败,请检查网络连接或稍后重试")
            ];
            await this.sendForwardMessage(e, nodes);
        }

        return true;
    }

    async searchAlbum(e) {
        const keyword = e.msg.replace(/^#th\s*(?:搜专|搜索专辑|album)\s+/, '').trim();
        
        if (!keyword) {
            const nodes = [
                this.createForwardContent("请在命令后提供专辑关键词,例如:#th搜专 幻想郷茶房")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        try {
            const [thdiscResults, apiResults] = await Promise.all([
                this.searchThdisc(keyword),
                this.searchTHBWikiAlbum(keyword)
            ]);

            const nodes = [];

            if (thdiscResults.length > 0) {
                nodes.push(this.createForwardContent(
                    `💽 Thdisc数据找到 ${thdiscResults.length} 个专辑:\n\n` +
                    thdiscResults.slice(0, 3).map((item, index) => 
                        `${index + 1}. ${item.name}\n` +
                        (item.group ? `   社团: ${item.group}\n` : '') +
                        `   路径: ${item.path}`
                    ).join('\n\n')
                ));
            }

            if (apiResults && apiResults.length > 0) {
                nodes.push(this.createForwardContent(
                    `🎼 THBWiki找到 ${apiResults.length} 个专辑:\n\n` +
                    apiResults.slice(0, 3).map((album, index) => 
                        `${index + 1}. ${album.name}\n` +
                        (album.circle ? `   社团: ${album.circle}\n` : '') +
                        `   💡 使用 #th详情 "${album.name}" 查看详细信息`
                    ).join('\n\n')
                ));
            }

            if (nodes.length === 0) {
                nodes.push(this.createForwardContent("❌ 未找到相关专辑"));
            }

            await this.sendForwardMessage(e, nodes);
            
        } catch (error) {
            logger.error(`[搜索专辑失败] ${error}`);
            const nodes = [
                this.createForwardContent("❌ 搜索失败,请检查网络连接或稍后重试")
            ];
            await this.sendForwardMessage(e, nodes);
        }

        return true;
    }

    async searchEvent(e) {
        const keyword = e.msg.replace(/^#th\s*(?:搜展|搜索展会|event)\s+/, '').trim();
        
        if (!keyword) {
            const nodes = [
                this.createForwardContent("请在命令后提供展会关键词,例如:#th搜展 C92")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        try {
            const results = await this.searchTHBWikiAlbum(keyword, true);
            
            if (!results || results.length === 0) {
                const nodes = [
                    this.createForwardContent(`❌ 未找到"${keyword}"展会的相关作品`)
                ];
                await this.sendForwardMessage(e, nodes);
                return true;
            }

            const nodes = [
                this.createForwardContent(`🎪 找到"${keyword}"展会的 ${results.length} 个作品`),
                ...results.slice(0, this.config.maxResults).map((album, index) => 
                    this.createForwardContent(
                        `${index + 1}. ${album.name}\n` +
                        `   社团: ${album.circle || '未知'}\n` +
                        (album.date ? `   日期: ${album.date}\n` : '') +
                        `   💡 使用 #th详情 "${album.name}" 查看详细信息`
                    )
                )
            ];

            await this.sendForwardMessage(e, nodes);
            
        } catch (error) {
            logger.error(`[搜索展会失败] ${error}`);
            const nodes = [
                this.createForwardContent("❌ 搜索失败,请检查网络连接或稍后重试")
            ];
            await this.sendForwardMessage(e, nodes);
        }

        return true;
    }

    async getAlbumDetail(e) {
        const albumName = e.msg.replace(/^#th\s*(?:详情|详细信息|detail)\s+/, '').trim();
        
        if (!albumName) {
            const nodes = [
                this.createForwardContent('请指定专辑名称,例如:#th详情 "POP|CULTURE 5"')
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        try {
            const albumDetail = await this.getTHBWikiAlbumDetail(albumName);
            
            if (!albumDetail) {
                const nodes = [
                    this.createForwardContent(`❌ 未找到专辑"${albumName}"的详细信息`)
                ];
                await this.sendForwardMessage(e, nodes);
                return true;
            }

            const nodes = [
                this.createForwardContent(
                    `💿 ${albumDetail.alname || albumName}\n\n` +
                    (albumDetail.circle ? `🏷️ 社团: ${albumDetail.circle}\n` : '') +
                    (albumDetail.event ? `🎪 展会: ${albumDetail.event}\n` : '') +
                    (albumDetail.date ? `📅 日期: ${albumDetail.date}\n` : '') +
                    (albumDetail.year ? `📅 年份: ${albumDetail.year}\n` : '') +
                    (albumDetail.track ? `🎵 音轨数: ${albumDetail.track}\n` : '') +
                    (albumDetail.time ? `⏱️ 时长: ${Math.floor(albumDetail.time / 60)}分${albumDetail.time % 60}秒\n` : '') +
                    (albumDetail.property ? `📊 类型: ${albumDetail.property}\n` : '') +
                    (albumDetail.style ? `🎨 风格: ${albumDetail.style}` : '')
                )
            ];

            if (albumDetail.tracks && albumDetail.tracks.length > 0) {
                const trackText = albumDetail.tracks.slice(0, 8).map(track => 
                    `${track.trackno || '?'}. ${track.name}\n` +
                    (track.artist ? `   表演者: ${track.artist}\n` : '') +
                    (track.ogmusic ? `   原曲: ${track.ogmusic}\n` : '') +
                    (track.time ? `   时长: ${Math.floor(track.time / 60)}:${(track.time % 60).toString().padStart(2, '0')}` : '')
                ).join('\n\n');
                
                nodes.push(this.createForwardContent(`🎼 曲目列表:\n\n${trackText}`));
                
                if (albumDetail.tracks.length > 8) {
                    nodes.push(this.createForwardContent(`... 等 ${albumDetail.tracks.length} 首曲目`));
                }
            }

            await this.sendForwardMessage(e, nodes);
            
        } catch (error) {
            logger.error(`[获取专辑详情失败] ${error}`);
            const nodes = [
                this.createForwardContent("❌ 获取专辑详情失败,请检查网络连接或稍后重试")
            ];
            await this.sendForwardMessage(e, nodes);
        }

        return true;
    }

    async randomAlbum(e) {
        if (this.thdiscData.length === 0) {
            const nodes = [
                this.createForwardContent("❌ Thdisc数据为空,请检查数据文件")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        const randomIndex = Math.floor(Math.random() * this.thdiscData.length);
        const album = this.thdiscData[randomIndex];

        const nodes = [
            this.createForwardContent("🎲 为您随机推荐一张专辑"),
            this.createForwardContent(
                `💿 ${album.name}\n\n` +
                (album.group ? `🏷️ 社团: ${album.group}\n` : '') +
                (album.date ? `📅 日期: ${album.date}\n` : '') +
                `📂 路径: ${album.path}\n\n` +
                `✨ 使用 #th详情 "${album.name}" 查看THBWiki详细信息`
            )
        ];

        await this.sendForwardMessage(e, nodes);
        return true;
    }

    async showStats(e) {
        if (this.thdiscData.length === 0) {
            const nodes = [
                this.createForwardContent("❌ Thdisc数据为空,请检查数据文件")
            ];
            await this.sendForwardMessage(e, nodes);
            return true;
        }

        const groups = new Set(this.thdiscData.map(item => item.group).filter(Boolean));
        
        const nodes = [
            this.createForwardContent(
                `📊 音乐库统计信息\n\n` +
                `💽 Thdisc数据: ${this.thdiscData.length} 个专辑\n` +
                `🎪 社团数量: ${groups.size} 个\n` +
                `☁️ 车万云音乐数据: ${this.chewanMusicData.length} 条\n\n` +
                `💡 使用 #th搜 <关键词> 全局搜索\n` +
                `💡 使用 #th搜歌 <歌曲名> 搜索歌曲\n` +
                `💡 使用 #th搜社 <社团名> 搜索THBWiki社团\n` +
                `💡 使用 #th详情 <专辑名> 查看专辑详细信息`
            )
        ];

        await this.sendForwardMessage(e, nodes);
        return true;
    }

    // ========== THBWiki API 方法 ==========

    async searchTHBWikiAlbum(keyword, includeCircle = false) {
        try {
            const params = new URLSearchParams({
                m: 'sa',
                v: keyword,
                l: this.config.maxResults,
                d: '0'
            });
            
            if (includeCircle) {
                params.append('o', '1');
            }

            const response = await fetch(`${this.config.thbWikiAPI}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            return data.map(album => ({
                id: album[0],
                name: album[1],
                circle: album[2] || null
            }));

        } catch (error) {
            logger.error(`[THBWiki专辑搜索失败] ${error}`);
            return null;
        }
    }

    async searchTHBWikiTrack(keyword) {
        try {
            const params = new URLSearchParams({
                m: 'st',
                v: keyword,
                o: '1',
                l: this.config.maxResults,
                d: '0'
            });

            const response = await fetch(`${this.config.thbWikiAPI}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            return data.map(track => ({
                id: track[0],
                name: track[1],
                album: track[2],
                circle: track[3] || null
            }));

        } catch (error) {
            logger.error(`[THBWiki曲目搜索失败] ${error}`);
            return null;
        }
    }

    async getTHBWikiAlbumDetail(albumName) {
        try {
            const searchResults = await this.searchTHBWikiAlbum(albumName);
            if (!searchResults || searchResults.length === 0) {
                return null;
            }

            const albumId = searchResults[0].id;

            const params = new URLSearchParams({
                m: 'ga',
                a: albumId,
                f: 'alname circle event date year track time property style',
                p: 'name trackno artist time ogmusic arrange',
                d: 'nm'
            });

            const response = await fetch(`${this.config.thbWikiAPI}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data || data.length === 0) {
                return null;
            }

            const albumInfo = {};
            const tracks = [];

            if (data[0] && Array.isArray(data[0])) {
                data[0].forEach(item => {
                    if (item[0] === 'alname') albumInfo.alname = item[1][0];
                    if (item[0] === 'circle') albumInfo.circle = item[1].join(', ');
                    if (item[0] === 'event') albumInfo.event = item[1][0];
                    if (item[0] === 'date') albumInfo.date = item[1][0];
                    if (item[0] === 'year') albumInfo.year = item[1][0];
                    if (item[0] === 'track') albumInfo.track = item[1][0];
                    if (item[0] === 'time') albumInfo.time = parseInt(item[1][0]);
                    if (item[0] === 'property') albumInfo.property = item[1].join(', ');
                    if (item[0] === 'style') albumInfo.style = item[1].join(', ');
                });
            }

            if (data[1] && Array.isArray(data[1])) {
                data[1].forEach(trackData => {
                    const track = { id: trackData[0][1] };
                    trackData.forEach(item => {
                        if (item[0] === 'name') track.name = item[1][0];
                        if (item[0] === 'trackno') track.trackno = item[1][0];
                        if (item[0] === 'artist') track.artist = item[1].join(', ');
                        if (item[0] === 'time') track.time = parseInt(item[1][0]);
                        if (item[0] === 'ogmusic') track.ogmusic = item[1].join(', ');
                        if (item[0] === 'arrange') track.arrange = item[1].join(', ');
                    });
                    tracks.push(track);
                });
            }

            albumInfo.tracks = tracks;
            return albumInfo;

        } catch (error) {
            logger.error(`[获取专辑详情失败] ${error}`);
            return null;
        }
    }

    // ========== Thdisc数据方法 ==========

    searchThdisc(keyword) {
        const lower = keyword.toLowerCase();
        return this.thdiscData.filter(item =>
            (item.name && item.name.toLowerCase().includes(lower)) ||
            (item.path && item.path.toLowerCase().includes(lower))
        ).slice(0, this.config.maxResults);
    }

    searchThdiscSong(keyword) {
        const lower = keyword.toLowerCase();
        return this.thdiscData.filter(item =>
            (item.name && item.name.toLowerCase().includes(lower)) ||
            (item.group && item.group.toLowerCase().includes(lower)) ||
            (item.path && item.path.toLowerCase().includes(lower))
        ).map(item => ({
            name: item.name,
            album: item.name,
            group: item.group,
            path: item.path,
            date: item.date
        })).slice(0, this.config.maxResults);
    }

    // ========== 车万云音乐数据方法 ==========

    loadChewanMusicData() {
        try {
            if (!fs.existsSync(this.config.chewanMusicFile)) {
                logger.warn(`[东方音乐搜寻] 车万云音乐数据文件不存在: ${this.config.chewanMusicFile}`);
                this.chewanMusicData = [];
                return;
            }

            const content = fs.readFileSync(this.config.chewanMusicFile, 'utf8');
            this.chewanMusicData = JSON.parse(content);
            logger.mark(`[东方音乐搜寻] 成功加载 ${this.chewanMusicData.length} 条车万云音乐数据`);
            
        } catch (error) {
            logger.error('[东方音乐搜寻] 加载车万云音乐数据失败:', error);
            this.chewanMusicData = [];
        }
    }

    calculateMatchScore(song, keyword) {
        let score = 0;
        const lowerKeyword = keyword.toLowerCase();
        
        const fieldWeights = {
            '原曲名': 10,
            '专辑名': 8,
            '使用场景等信息': 7,
            '作曲家': 6,
            '相关角色': 5,
            '别名': 9,
            '歌曲名称读音': 4
        };

        for (const [field, weight] of Object.entries(fieldWeights)) {
            if (song[field] && song[field].toLowerCase().includes(lowerKeyword)) {
                score += weight;
                
                if (song[field].toLowerCase() === lowerKeyword) {
                    score += weight * 2;
                }
                
                if (song[field].toLowerCase().startsWith(lowerKeyword)) {
                    score += weight;
                }
            }
        }

        return score;
    }

    getMatchStars(score) {
        const maxScore = 50;
        const starCount = Math.min(5, Math.ceil((score / maxScore) * 5));
        return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
    }

    searchChewanMusic(keyword) {
        const results = this.chewanMusicData.map(song => {
            const score = this.calculateMatchScore(song, keyword);
            return { item: song, score };
        }).filter(result => result.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, this.config.maxResults);

        return results;
    }

    loadThdiscData() {
        try {
            if (!fs.existsSync(this.config.dataFile)) {
                logger.warn(`[东方音乐搜寻] Thdisc数据文件不存在: ${this.config.dataFile}`);
                this.createSampleData();
                return;
            }

            const content = fs.readFileSync(this.config.dataFile, 'utf8');
            this.parseTreeStructure(content);
            logger.mark(`[东方音乐搜寻] 成功解析 ${this.thdiscData.length} 条Thdisc数据`);
            
        } catch (error) {
            logger.error('[东方音乐搜寻] 加载Thdisc数据失败:', error);
            this.thdiscData = [];
        }
    }

    createSampleData() {
        try {
            const sampleData = `.
├── [魂音泉]
│   ├── 2016.10.16 [TOS-035] ANOTHER LINE EP [秋例大祭3]
│   └── 2016.12.29 [TOS-036] 魂音泉 空オーケストラ ~たまオケ~ 3 [C91]
├── [Alstroemeria Records]
│   └── 2015.12.30 POP|CULTURE 5 [C89]
└── [森罗万象]
    └── 2019.05.05 インフェルノシティ [例大祭16]`;
            
            fs.writeFileSync(this.config.dataFile, sampleData, 'utf8');
            logger.mark(`[东方音乐搜寻] 已创建示例Thdisc数据文件`);
            this.parseTreeStructure(sampleData);
            
        } catch (error) {
            logger.error('[东方音乐搜寻] 创建示例Thdisc数据文件失败:', error);
        }
    }

    parseTreeStructure(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const thdiscData = [];
        let currentGroup = '';
        const pathStack = [];

        for (const line of lines) {
            if (line.trim() === '.' || line.includes('directories') || line.includes('files')) {
                continue;
            }

            const indentMatch = line.match(/^(\s*)/);
            const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 4) : 0;
            
            let cleanLine = line
                .replace(/[├└│─┬]/g, '')
                .replace(/──+/g, '')
                .trim();

            if (!cleanLine) continue;

            while (pathStack.length > indentLevel) {
                pathStack.pop();
            }

            if (cleanLine.startsWith('[') && cleanLine.endsWith(']')) {
                currentGroup = cleanLine;
                pathStack.push(cleanLine);
                continue;
            }

            pathStack.push(cleanLine);
            const fullPath = pathStack.join('/');

            if (this.isNonAlbumDirectory(cleanLine)) {
                continue;
            }

            const albumInfo = {
                name: cleanLine,
                group: currentGroup,
                path: fullPath,
                date: this.extractDate(cleanLine),
                catalog: this.extractCatalog(cleanLine),
                event: this.extractEvent(cleanLine)
            };

            thdiscData.push(albumInfo);
        }

        this.thdiscData = thdiscData;
    }

    isNonAlbumDirectory(name) {
        const nonAlbumKeywords = ['CD DATA', 'MP3', 'おまけ', 'bk', 'Scans', 'LYRICS'];
        return nonAlbumKeywords.some(keyword => name.includes(keyword));
    }

    extractDate(text) {
        const dateMatch = text.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
        return dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
    }

    extractCatalog(text) {
        const catalogMatch = text.match(/\[([A-Z0-9]+-[0-9]+[A-Z]?)\]/);
        return catalogMatch ? catalogMatch[1] : null;
    }

    extractEvent(text) {
        const events = ['C\\d+', '例大祭\\d+', 'M3-\\d+', '紅楼夢\\d+'];
        for (const eventPattern of events) {
            const eventMatch = text.match(new RegExp(eventPattern));
            if (eventMatch) return eventMatch[0];
        }
        return null;
    }
}
//2025年10月25日 苦逼高一
