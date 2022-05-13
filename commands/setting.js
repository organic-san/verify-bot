const Discord = require('discord.js');
const fs = require('fs');
const guild = require('../functions/guildData.js');

module.exports = {
    tag: "guildData",

    /**
     * 
     * @param {Discord.Message<boolean>} msg
     * @param {Discord.Client<boolean>} client
     * @param {guild.guildData} guildData
     */
    async execute(msg, client, guildData) {
        if(!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) return;
        let text = msg.content.slice(1).split(/\s+/);
        console.log('              └subCmd: ' + text[1]);
        
        if(['welcomemessage', 'wm'].includes(text[1])) {
            let wm = msg.content.slice(text[0].length + text[1].length + 2);
            if(wm.length <= 0) msg.reply('請在指令後方補上要設定的句子。')
            else {
                guildData.welcomeMessage = wm;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply('歡迎訊息設定完成。')
                
            }

        } else if(['vc', 'verifychannel'].includes(text[1])) {
            let channel = text[2];
            if(!channel.match(/<#[0-9]+>/) && !channel.match(/[0-9]+/) ) return msg.reply('請在指令後方加入頻道或頻道ID。');
            channel = channel.match(/[0-9]+/)[0];
            msg.guild.channels.fetch(channel).then(channel => {
                guildData.verifyChannel = channel.id;
                fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
                msg.reply(`驗證頻道設定完成: <#${guildData.verifyChannel}> (${guildData.verifyChannel})。`);
            }).catch(() => {
                msg.reply('請正確輸入在本伺服器的頻道或頻道ID。');
            })
            
        } else if(['aq', 'addquestion'].includes(text[1])) {
            text[0] = ''; text[1] = '';
            let question = text.join(' ').split(';')[0].trim();
            let answer = text.join(' ').split(';').slice(1);
            if(!question || !answer[0]) return msg.reply('請在指令後方加入問題與預設答案。');
            guildData.questionList.push({question, answer});
            fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
            console.log(guildData);
            msg.reply(
                `問題新增完成: \n` + 
                `問題: ${guildData.questionList[guildData.questionList.length - 1].question}\n` + 
                `回答: ${guildData.questionList[guildData.questionList.length - 1].answer.join('、')}`
            );

        } else if(['showquestion', 'sq'].includes(text[1])) {
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
            
        } else if(['deletequestion', 'dq'].includes(text[1])) {
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
            ql = ql.splice(id - 1, 1);
            fs.writeFileSync(`./guildData/${msg.guild.id}.json`, JSON.stringify(guildData, null, '\t'));
            collected.reply(
                `問題移除完成: \n` + 
                `問題: ${removed.question}\n` + 
                `回答: ${removed.answer.join('、')}`
            );
        }
    }
}