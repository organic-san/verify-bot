const Discord = require('discord.js');
const guild = require('../functions/guildData');

module.exports = {
    tag: "guildDataverifing",
    subCmd: false,

    /**
     * 
     * @param {Discord.Message<boolean>} msg 
     * @param {Discord.Client<boolean>} client
     * @param {guild.guildData} guildData
     * @param {Array<string>} verifying
     */
    async execute(msg, client, guildData, verifying) {
        if(msg.channel.isThread()) return;
        if(msg.author.bot) return;
        if(msg.channel.id !== guildData.verifyChannel) return msg.channel.send(
            msg.author.toString() + 
            '\n只能在驗證頻道輸入指令。\n' + 
            'You can only enter commands in the verification channel.'
        );
        if(msg.member.roles.cache.has(guildData.role)) return msg.channel.send(
            msg.author.toString() + 
            '\n您已經通過驗證。\n' + 
            'You have been verified.'
        );
        if(verifying.includes(msg.author.id)) return msg.channel.send(
            msg.author.toString() + 
            '\n您已經開始進行驗證，請進入您的討論串繼續進行驗證程序。\n' + 
            'You have started the verification process, please go to to your verification thread to continue the verification process.'
        );
        if(!guildData.isWorking) return msg.channel.send(msg.author.toString() + 
        '\n現在系統並未運作，請聯繫管理員。\nThe system is not working now, please contact the administrator.');
        verifying.push(msg.author.id);
        let backstage = await msg.guild.channels.fetch(guildData.backstageChannel);
        backstage.send(`${msg.author} (${msg.author.id}) 手動開始驗證程序。`);
        let threadMsg = await msg.channel.send(
            msg.author.toString() + '\n請進入下方的討論串開始驗證程序。\n' + 
            'please join to the thread below to start the server join validation process.'
        );
        let thread = await threadMsg.startThread({name: `驗證 - ${msg.author.id}`, autoArchiveDuration: 1440, rateLimitPerUser: 5});
        let queAmount = guildData.questionGenerateAmount === 0 ? guildData.questionList.length : guildData.questionGenerateAmount;
        await thread.send(
            '請回答管理員提出的問題，以協助他們審核你的伺服器加入申請。' + 
            '只有管理員和伺服器擁有者會看見你的回答。' + 
            '一共有 ' + queAmount + ' 個問題，請在__這個討論串__中輸入您的回答，並在 ' + guildData.verifyTimelimit + ' 分鐘前完成驗證。\n' + 
            'Please answer the questions asked by the administrators to help them review your server membership application. ' + 
            'Only administrators and server owners will see your answers. ' + 
            'There are a total of ' + queAmount + ' questions, please enter your answer __in this thread__ and complete the verification before ' + 
            guildData.verifyTimelimit + ' minutes.'
        );
        
        /**
         * @type {Array<{question: string, answer: string[]}>}
         */
        let queList = [];
        if(guildData.questionGenerateAmount !== 0) {
            let perList = [];
            guildData.questionList.forEach(q => perList.push(q));
            for(let i = 0; i < guildData.questionGenerateAmount; i ++) {
                let random = Math.floor(Math.random() * perList.length);
                queList[i] = perList[random];
                perList.splice(random, 1);
            }
        } else {
            guildData.questionList.forEach(q => queList.push(q));
        }

        let step = 1;
        let answer = [];

        await thread.send(`${step}. ${queList[0].question}`);

        let collector = thread.createMessageCollector({time: (guildData.verifyTimelimit === 0 ? 60 : guildData.verifyTimelimit) * 60 * 1000});

        collector.on('collect', async (cmsg) => {
            //if(cmsg.deletable) cmsg.delete().catch(() => {});
            if(cmsg.author.id !== msg.author.id) return; 
            if(answer.length > queAmount) return;
            answer.push(cmsg.content);
            step++;
            if(step <= queAmount) {
                thread.send(`${step}. ${queList[step - 1].question}`);
            } else {
                let inspection = 0;
                answer.forEach((ans, ind) => {
                    if(!queList[ind].answer.includes(ans)) inspection++;
                })
                if(inspection > 0) {
                    thread.send('已確認您的回答，請等待管理員審核。\nYour answer has been confirmed, please wait for the administrator to review it.');
                    let embed = new Discord.MessageEmbed()
                    .setColor(process.env.EMBEDCOLOR)
                    .setTitle('驗證問題回答結果')
                    .setAuthor({name: `${msg.author.tag}`, iconURL: msg.author.displayAvatarURL({dynamic: true})})
                    .setTimestamp()
                    .setFooter({text: 'user Id: ' +  msg.author.id});

                    answer.forEach((ans, ind) => {
                        embed.addField(`問題: ${queList[ind].question.length > 250 ? queList[ind].question.substring(0, 250) + '...' : queList[ind].question}`, `回答: ${ans}\n預設答案: ${queList[ind].answer.join('、')}`);
                    })
                    let button = new Discord.MessageActionRow().addComponents([
                        new Discord.MessageButton()
                            .setLabel('通過')
                            .setCustomId(`verify;pass;${msg.author.id};${thread.id};${threadMsg.id}`)
                            .setStyle('SUCCESS'),
                        new Discord.MessageButton()
                            .setLabel('駁回')
                            .setCustomId(`verify;fail;${msg.author.id};${thread.id};${threadMsg.id}`)
                            .setStyle('PRIMARY'),
                        new Discord.MessageButton()
                            .setLabel('踢出')
                            .setCustomId(`verify;kick;${msg.author.id};${thread.id};${threadMsg.id}`)
                            .setStyle('DANGER')
                    ])

                    backstage.send({embeds: [embed], components: [button]});
                } else {
                    thread.delete();
                    if(verifying.findIndex((i => i === msg.author.id)) === -1) {
                        threadMsg.edit(
                            msg.author.toString() + 
                            '\n驗證取消。\n' + 
                            'Verification cancelled.'
                        );
                        return collector.stop('end');
                    }
                    verifying.splice(verifying.findIndex((i => i === msg.author.id)), 1);
                    let err = false;
                    await msg.member.roles.add(guildData.role).catch(() => err = true);
                    if(err) {
                        threadMsg.edit(
                            msg.author.toString() +
                            '發生錯誤：權限不足，請聯絡管理員。\n' + 
                            'Error: Permissions are not enough, please contact the administrator.'
                        );
                        backstage.send(`${msg.author} (${msg.author.id}) 驗證過程發生錯誤：身分組權限不足。`);
                    } else {
                        threadMsg.edit(
                            msg.author.toString() +
                            '\n恭喜您通過驗證，可以正式加入伺服器。\n' + 
                            'Congratulations, you have been verified and can officially join the server.'
                        );
                        backstage.send(`${msg.author} (${msg.author.id}) 驗證自動通過。`);
                    }
                }
                collector.stop('end');
            }
        });

        collector.on('end', async (c, r) => {
            if(r === 'time') {
                thread.delete();
                if(verifying.findIndex((i => i === msg.author.id)) === -1) return threadMsg.edit(
                    msg.author.toString() + 
                    '\n驗證取消。\n' + 
                    'Verification cancelled.'
                );
                verifying.splice(verifying.findIndex((i => i === msg.author.id)), 1);
                if(guildData.verifyTimelimit === 0) {
                    threadMsg.edit(
                        msg.author.toString() + 
                        '\n逾時，驗證失敗。請輸入`.verify`重新開始驗證。\n' + 
                        'Timeout, verification failed. Please type `.verify` to restart the verification again.'
                    );
                    backstage.send(`${mag.author} (${msg.author.id}) 驗證因逾時而取消。`);
                } else {
                    threadMsg.edit(
                        msg.author.toString() + 
                        '\n逾時，驗證失敗。\n' + 
                        'Timeout, verification failed.'
                    );
                    if(!msg.member) return backstage.send({content: `${msg.author} (${msg.author.id}) 用戶已退出伺服器。`});
                    if(!msg.member.kickable) return backstage.send({content: `錯誤：權限不足，無法在驗證逾時後踢出 ${msg.author} (${msg.author.id})。`});
                    await msg.author.send(
                        `由於您未在時間限制內完成驗證，因此您被踢出 **${msg.guild.name}**。\n` + 
                        `You have been kicked from **${msg.guild.name}** because you did not complete the verification within the time limit.`
                    ).catch(() => {});
                    await msg.member.kick().catch(() => {});
                    backstage.send(`${msg.author} (${msg.author.id}) 因為驗證逾時而被踢出。`);
                }
            }
            
        })
    }
}