const Discord = require('discord.js');
const guild = require('../functions/guildData');

module.exports = {
    tag: "handGuildDataverifing",
    subCmd: false,

    /**
     * 
     * @param {Discord.Message<boolean>} msg 
     * @param {Discord.Client<boolean>} client
     * @param {guild.guildData} guildData
     * @param {Array<string>} verifying
     */
    async execute(msg, client, guildData, verifying) {
        let msgcontent = msg.content.split(/\s+/);
        if(!msgcontent[1]) return;
        if(!msgcontent[2]) return;
        /**
         * @type {Discord.Guild}
         */
        let guild = client.guilds.cache.get(msgcontent[1]);
        if(!guild) return msg.reply('no guild');
        let nouser = false;
        let user = await guild.members.fetch(msgcontent[2]).catch(() => nouser = true);
        if(nouser) return msg.reply('no user');
        guildData = guildData.get(guild.id);
        
        //if(msg.channel.isThread()) return;
        if(user.bot) return;
        /*
        if(msg.channel.id !== guildData.verifyChannel) return msg.channel.send(
            msg.author.toString() + 
            '\n只能在驗證頻道輸入指令。\n' + 
            'You can only enter commands in the verification channel.'
        );
        */
        if(user.roles.cache.has(guildData.role)) return msg.channel.send(
            user.toString() + 
            '\n已經通過驗證。'
        );
        if(verifying.includes(user.id)) return msg.channel.send(
            msg.author.toString() + 
            '\n已經開始進行驗證，請進入他的討論串繼續進行驗證程序。'
        );
        if(!guildData.isWorking) return msg.channel.send(msg.author.toString() + 
        '\n現在系統並未運作，請聯繫管理員。');
        verifying.push(user.id);
        let backstage = await guild.channels.fetch(guildData.backstageChannel);
        let verifyChannel = await guild.channels.fetch(guildData.verifyChannel);
        backstage.send(`${user} (${user.id}) 自動開始驗證程序。`);
        let threadMsg = await verifyChannel.send(
            user.toString() + '\n請進入下方的討論串開始驗證程序。\n' + 
            'please join to the thread below to start the server join validation process.'
        );
        let thread = await threadMsg.startThread({name: `驗證 - ${user.id}`, autoArchiveDuration: 1440, rateLimitPerUser: 5});
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
            if(cmsg.author.id !== user.id) return; 
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
                    .setAuthor({name: `${user.user.tag}`, iconURL: user.displayAvatarURL({dynamic: true})})
                    .setTimestamp()
                    .setFooter({text: 'user Id: ' +  user.id});

                    answer.forEach((ans, ind) => {
                        embed.addField(`問題: ${queList[ind].question.length > 240 ? queList[ind].question.substring(0, 240) + '...' : queList[ind].question}`, `回答: ${ans}\n預設答案: ${queList[ind].answer.join('、')}`);
                    })
                    let button = new Discord.MessageActionRow().addComponents([
                        new Discord.MessageButton()
                            .setLabel('通過')
                            .setCustomId(`verify;pass;${user.id};${thread.id};${threadMsg.id}`)
                            .setStyle('SUCCESS'),
                        new Discord.MessageButton()
                            .setLabel('駁回')
                            .setCustomId(`verify;fail;${user.id};${thread.id};${threadMsg.id}`)
                            .setStyle('PRIMARY'),
                        new Discord.MessageButton()
                            .setLabel('踢出')
                            .setCustomId(`verify;kick;${user.id};${thread.id};${threadMsg.id}`)
                            .setStyle('DANGER')
                    ])

                    backstage.send({embeds: [embed], components: [button]});
                } else {
                    thread.delete();
                    if(verifying.findIndex((i => i === user.id)) === -1) {
                        threadMsg.edit(
                            user.toString() + 
                            '\n驗證取消。\n' + 
                            'Verification cancelled.'
                        );
                        return collector.stop('end');
                    }
                    verifying.splice(verifying.findIndex((i => i === user.id)), 1);
                    let err = false;
                    await user.roles.add(guildData.role).catch(() => err = true);
                    if(err) {
                        threadMsg.edit(
                            user.toString() +
                            '發生錯誤：權限不足，請聯絡管理員。\n' + 
                            'Error: Permissions are not enough, please contact the administrator.'
                        );
                        backstage.send(`${user} (${user.id}) 驗證過程發生錯誤：身分組權限不足。`);
                    } else {
                        threadMsg.edit(
                            msg.author.toString() +
                            '\n恭喜您通過驗證，可以正式加入伺服器。\n' + 
                            'Congratulations, you have been verified and can officially join the server.'
                        );
                        backstage.send(`${user} (${user.id}) 驗證自動通過。`);
                    }
                }
                collector.stop('end');
            }
        });

        collector.on('end', async (c, r) => {
            if(r === 'time') {
                thread.delete();
                if(verifying.findIndex((i => i === user.id)) === -1) return threadMsg.edit(
                    user.toString() + 
                    '\n驗證取消。\n' + 
                    'Verification cancelled.'
                );
                verifying.splice(verifying.findIndex((i => i === user.id)), 1);
                if(guildData.verifyTimelimit === 0) {
                    threadMsg.edit(
                        user.toString() + 
                        '\n逾時，驗證失敗。請輸入`.verify`重新開始驗證。\n' + 
                        'Timeout, verification failed. Please type `.verify` to restart the verification again.'
                    );
                    backstage.send(`${user} (${user.id}) 驗證因逾時而取消。`);
                } else {
                    threadMsg.edit(
                        user.toString() + 
                        '\n逾時，驗證失敗。\n' + 
                        'Timeout, verification failed.'
                    );
                    if(!user) return backstage.send({content: `${user} (${user.id}) 用戶已退出伺服器。`});
                    if(!user.kickable) return backstage.send({content: `錯誤：權限不足，無法在驗證逾時後踢出 ${user} (${user.id})。`});
                    await user.send(
                        `由於您未在時間限制內完成驗證，因此您被踢出 **${guild.name}**。\n` + 
                        `You have been kicked from **${guild.name}** because you did not complete the verification within the time limit.`
                    ).catch(() => {});
                    await user.kick().catch(() => {});
                    backstage.send(`${user} (${user.id}) 因為驗證逾時而被踢出。`);
                }
            }
            
        })
    }
}