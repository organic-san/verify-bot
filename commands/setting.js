const Discord = require('discord.js');
const fs = require('fs');
const guild = require('../functions/guildData.js');

module.exports = {
    tag: "guildData",
    subCmd: true,

    /**
     * 
     * @param {Discord.Message<boolean>} msg
     * @param {Discord.Client<boolean>} client
     * @param {guild.guildData} guildData
     */
    async execute(msg, client, guildData) {
        if(!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) return;
        let text = msg.content.slice(1).split(/\s+/);
        
        /*
        if(['welcome-message', 'wm'].includes(text[1])) {
            let wm = msg.content.slice(text[0].length + text[1].length + 2);
            if(wm.length <= 0) msg.reply('請在指令後方補上要設定的句子。')
            else {
                guildData.welcomeMessage = wm;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply('歡迎訊息設定完成。')
                
            }

        } else*/ if(['vc', 'verify-channel'].includes(text[1])) {
            let channel = text[2];
            if(!channel) return msg.reply('請在指令後方加入頻道或頻道ID。');
            if(!channel.match(/<#[0-9]+>/) && !channel.match(/[0-9]+/) ) return msg.reply('請在指令後方加入頻道或頻道ID。');
            if(channel == guildData.backstageChannel) return msg.reply('請不要將驗證頻道與後台頻道設為相同的頻道。');
            channel = channel.match(/[0-9]+/)[0];
            msg.guild.channels.fetch(channel).then(channel => {
                if(channel.type !== 'GUILD_TEXT') return msg.reply('請不要輸入文字頻道以外的頻道。');
                guildData.verifyChannel = channel.id;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply(`驗證頻道設定完成: <#${guildData.verifyChannel}> (${guildData.verifyChannel})。`);
            }).catch(() => {
                msg.reply('請正確輸入在本伺服器的頻道或頻道ID。');
            })
            
        } else if(['bc', 'backstage-channel'].includes(text[1])) {
            let channel = text[2];
            if(!channel) return msg.reply('請在指令後方加入頻道或頻道ID。');
            if(!channel.match(/<#[0-9]+>/) && !channel.match(/[0-9]+/) ) return msg.reply('請在指令後方加入頻道或頻道ID。');
            channel = channel.match(/[0-9]+/)[0];
            if(channel == guildData.verifyChannel) return msg.reply('請不要將後台頻道與驗證頻道設為相同的頻道。');
            msg.guild.channels.fetch(channel).then(channel => {
                if(channel.type !== 'GUILD_TEXT') return msg.reply('請不要輸入文字頻道以外的頻道。');
                guildData.backstageChannel = channel.id;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply(`後台頻道設定完成: <#${guildData.backstageChannel}> (${guildData.backstageChannel})。`);
            }).catch(() => {
                msg.reply('請正確輸入在本伺服器的頻道或頻道ID。');
            })
            
        } else if(['aq', 'add-question'].includes(text[1])) {
            text[0] = ''; text[1] = '';
            let question = text.join(' ').split(';')[0].trim();
            let answer = text.join(' ').split(';').slice(1);
            if(!question || !answer[0]) return msg.reply('請在指令後方加入問題與預設答案。');
            guildData.questionList.push({question, answer});
            fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
            msg.reply(
                `問題新增完成: \n` + 
                `問題: ${guildData.questionList[guildData.questionList.length - 1].question}\n` + 
                `回答: ${guildData.questionList[guildData.questionList.length - 1].answer.join('、')}`
            );

        } else if(['show-question', 'sq'].includes(text[1])) {
            let ql = guildData.questionList;
            if(ql.length === 0) return msg.reply({
                content: '目前沒有問題可以顯示，請先新增問題。',
                allowedMentions: {repliedUser: false}
            })
            for(let i = 0; i < Math.ceil(ql.length / 10); i++) {
                const embed = new Discord.MessageEmbed()
                    .setColor(process.env.EMBEDCOLOR)
                    .setTitle(`${msg.guild.name} 驗證用問題一覽`)
                    .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
                    .setTimestamp();
                for(let j = 0; j < Math.min(i * 10 + 10, ql.length - i * 10); j++) {
                    embed.addField(`${i * 10 + j + 1}. ${ql[i * 10 + j].question}`, `答案一覽: ${ql[i * 10 + j].answer.join('、')}`)
                }
                if(i === 0) {
                    msg.reply({
                        embeds: [embed],
                        allowedMentions: {repliedUser: false}
                    })
                } else {
                    msg.channel.send({embeds: [embed]})
                }
            }
            
        } else if(['delete-question', 'dq'].includes(text[1])) {
            let ql = guildData.questionList;
            if(ql.length === 0) return msg.reply('目前沒有問題可以刪除，請先新增問題。')
            for(let i = 0; i < Math.ceil(ql.length / 10); i++) {
                const embed = new Discord.MessageEmbed()
                    .setColor(process.env.EMBEDCOLOR)
                    .setTitle(`${msg.guild.name} 驗證用問題一覽`)
                    .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
                    .setTimestamp();
                for(let j = 0; j < Math.min(i * 10 + 10, ql.length - i * 10); j++) {
                    embed.addField(`${i * 10 + j + 1}. ${ql[i * 10 + j].question}`, `答案一覽: ${ql[i * 10 + j].answer.join('、')}`)
                }
                if(i === 0) {
                    msg.reply({
                        embeds: [embed],
                        allowedMentions: {repliedUser: false}
                    })
                } else {
                    msg.channel.send({embeds: [embed]})
                }
            }
            msg.channel.send({content: '請輸入要刪除的問題代碼。'})
            const collected = (await msg.channel.awaitMessages({
                max: 1, time: 3 * 60 * 1000, filter: (m) => m.author.id === msg.author.id
            })).last();

            if(!collected) return msg.channel.send('超過了設定時間，因此取消設定。');
            let id = parseInt(collected.content);
            if(id !== id) return collected.reply('請正確輸入問題代碼。');
            if(id <= 0 || id > ql.length) return collected.reply('請確保輸入的問題代碼在上方顯示的問題一覽的區間。');
            let removed = ql[id - 1];
            ql.splice(id - 1, 1);
            if(ql.length <= 0) {
                guildData.isWorking = false;
                guildData.questionGenerateAmount = 0;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                collected.reply(
                    `問題移除完成: \n` + 
                    `問題: ${removed.question}\n` + 
                    `回答: ${removed.answer.join('、')}\n` + 
                    `同時因為問題數量不足，因此關閉驗證系統運作。`
                );

            } else if(ql.length < guildData.questionGenerateAmount) {
                guildData.questionGenerateAmount = ql.length;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                collected.reply(
                    `問題移除完成: \n` + 
                    `問題: ${removed.question}\n` + 
                    `回答: ${removed.answer.join('、')}\n` +
                    `同時將產生的問題數量調整為與現有問題數量相當: ${guildData.questionGenerateAmount} 個。`
                );
            } else {
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                collected.reply(
                    `問題移除完成: \n` + 
                    `問題: ${removed.question}\n` + 
                    `回答: ${removed.answer.join('、')}`
                );
            }

        } else if(['endow-role', 'er'].includes(text[1])) {
            let role = text[2];
            if(!role) return msg.reply('請在指令後方加入身分組或身分組ID。');
            if(!role.match(/<@&[0-9]+>/) && !role.match(/[0-9]+/) ) return msg.reply('請在指令後方加入身分組或身分組ID。');
            role = role.match(/[0-9]+/)[0];
            msg.guild.roles.fetch(role).then(role => {
                if(role.managed) return msg.reply('請不要選擇整合身分組。');
                guildData.role = role.id;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply({content: `賦予身分組設定完成: <@&${guildData.role}> (${guildData.role})。`, allowedMentions: {roles: []}});
            }).catch(() => {
                msg.reply('請正確輸入在本伺服器的頻道或頻道ID。');
            })

        } else if(['question-amount', 'qa'].includes(text[1])) {
            let amount = parseInt(text[2]);
            if(amount < 0 || amount > guildData.questionList.length || amount !== amount) 
                return msg.reply('請不要超過目前的問題總數(' + guildData.questionList.length +'個)。');
                guildData.questionGenerateAmount = amount;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                if(amount > 0)
                    msg.reply({content: `問題產生數量調整完成: 設定為${guildData.questionGenerateAmount}個。`});
                else
                    msg.reply({content: `問題產生數量調整完成: 設定為會依序顯示所有問題。`});

        } else if(['kt', 'kick-timelimit'].includes(text[1])) {
            let timelimit = parseInt(text[2]);
            if(timelimit < 0 || timelimit !== timelimit) 
                return msg.reply('請設定正確的時間長度(t>0)。');
                guildData.verifyTimelimit = timelimit;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                if(timelimit > 0)
                    msg.reply({content: `入群驗證逾時踢出時間設定完成: ${guildData.verifyTimelimit} 分鐘。`});
                else
                    msg.reply({content: `入群驗證逾時踢出時間設定完成: 操作逾時後不踢出(逾時設為60分鐘)。`});

        } else if(['open'].includes(text[1])) {
            if(guildData.isWorking) return msg.reply({content: `系統已經是開啟狀態。`});
            let step = [false, false, false, true, false]; //驗證頻道，後台頻道，問題數量，問題產生數量，賦予身分組
            if(guildData.verifyChannel) step[0] = true;
            if(guildData.backstageChannel) step[1] = true;
            if(guildData.questionList.length > 0) step[2] = true;
            //if(guildData.questionGenerateAmount > 0) step[3] = true;
            if(guildData.role) step[4] = true;
            if(step[0] && step[1] && step[2] && step[3] && step[4]) {
                guildData.isWorking = true;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply({content: `開啟驗證系統運作。`});
                let backstage = await msg.guild.channels.fetch(guildData.backstageChannel);
                backstage.send(`開啟驗證系統運作。`);
            } else {
                let text = `無法開啟系統，因為尚未設定以下內容: ` + 
                    (step[0] ? '' : '驗證頻道、') + 
                    (step[1] ? '' : '後台頻道、') + 
                    (step[2] ? '' : '驗證用問題、') + 
                    //(step[3] ? '' : '問題產生數量\n') + 
                    (step[4] ? '' : '賦予身分組、');
                msg.reply(text.slice(0, -1));
            }

        } else if(['close'].includes(text[1])) {
            if(!guildData.isWorking) return msg.reply({content: `系統已經是關閉狀態。`});
            guildData.isWorking = false;
            fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
            msg.reply({content: `關閉驗證系統運作。`});
            let backstage = await msg.guild.channels.fetch(guildData.backstageChannel);
            backstage.send(`關閉驗證系統運作。`);

        } else if(['allkick-open', 'ao'].includes(text[1])) {
            if(guildData.allKick) return msg.reply({content: `系統已經是開啟狀態。`});
            guildData.allKick = true;
            fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
            msg.reply({content: `開啟全踢出系統運作。`});
            let backstage = await msg.guild.channels.fetch(guildData.backstageChannel);
            backstage.send(`開啟全踢出系統運作。`);

        } else if(['allkick-close', 'ac'].includes(text[1])) {
            if(!guildData.allKick) return msg.reply({content: `系統已經是關閉狀態。`});
            guildData.allKick = false;
            fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
            msg.reply({content: `關閉全踢出系統運作。`});
            let backstage = await msg.guild.channels.fetch(guildData.backstageChannel);
            backstage.send(`關閉全踢出系統運作。`);

        } else if(['show-all', 'sa'].includes(text[1])) {
            let vc = guildData.verifyChannel ? `<#${guildData.verifyChannel}> (${guildData.verifyChannel})` : '尚未設定。';
            let bc = guildData.backstageChannel ? `<#${guildData.backstageChannel}> (${guildData.backstageChannel})` : '尚未設定。';
            let role = guildData.role ? `<@&${guildData.role}> (${guildData.role})` : '尚未設定。';
            const embed = new Discord.MessageEmbed()
                .setColor(process.env.EMBEDCOLOR)
                .setTitle(`**${msg.guild.name}** 目前的設定`)
                //.addField('.setting welcome-message <message>\n.setting wm <message>', '設定歡迎訊息。')
                .addField('驗證系統是否開啟', guildData.isWorking ? '開啟' : '關閉')
                .addField('全踢出系統是否開啟', guildData.allKick ? '開啟' : '關閉')
                .addField('驗證頻道(verify-channel)', vc)
                .addField('後台頻道(backstage-channel)', bc)
                .addField('驗證問題一覽', `已設定 ${guildData.questionList.length} 個驗證問題\n個別詳細請使用指令\`.setting show-question\`查詢。`)
                .addField('驗證問題產生數量(question-amount)', `${guildData.questionGenerateAmount} 個`)
                .addField('入群驗證逾時踢出時間(kick-timelimit)', `${(guildData.verifyTimelimit === 0 ? '不在逾時後踢出，逾時設為 60 分鐘' : guildData.verifyTimelimit + ' 分鐘')}`)
                .addField('賦予身分組(endow-role)', role)
                .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
                .setTimestamp()
            msg.reply({
                embeds: [embed],
                allowedMentions: {repliedUser: false}
            })
        }
    }
}