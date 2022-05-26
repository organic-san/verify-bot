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
        if(msg.channel.id !== guildData.verifyChannel) return msg.reply(
            '只能在驗證頻道輸入指令。\n' + 
            'You can only enter commands in the verification channel.'
        );
        if(verifying.includes(msg.author.id)) return msg.reply(
            '您已經開始進行驗證，請進入您的討論串繼續進行驗證程序。\n' + 
            'You have started the verification process, please go to to your verification thread to continue the verification process.'
        );
        if(!guildData.isWorking) return msg.reply('現在系統並未運作，請聯繫管理員。\nThe system is not working now, please contact the administrator.');
        verifying.push(msg.author.id);
        let backstage = await msg.guild.channels.fetch(guildData.backstageChannel);
        backstage.send(`${msg.author} (${msg.author.id}) 手動開始驗證程序。`);
        let threadMsg = await msg.reply(
            msg.author.toString() + '\n請進入下方的討論串開始驗證程序。\n' + 
            'please join to the thread below to start the server join validation process.'
        );
        let thread = await threadMsg.startThread({name: `驗證 - ${msg.author.id}`, autoArchiveDuration: 1440});
        let queAmount = guildData.questionGenerateAmount === 0 ? guildData.questionList.length : guildData.questionGenerateAmount;
        await thread.send(
            '請回答管理員提出的問題，以協助他們審核你的伺服器加入申請。只有管理員和伺服器擁有者會看見你的回答。一共有 ' + queAmount + ' 個問題，請在問題下方輸入您的回答。\n' + 
            'Please answer the question(s) asked by the administrators to help them review your server join application. Only the administrator and the server owner will see your answers. Please enter your answer below question.。\n' + 
            'There are ' + queAmount + ' question(s) in total.'
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

        let collector = thread.createMessageCollector({time: 60 * 60 * 1000});

        collector.on('collect', (cmsg) => {
            if(cmsg.author.id !== msg.author.id) return;
            answer.push(cmsg.content);
            if(cmsg.deletable) cmsg.delete().catch(() => {});
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
                    .setFooter({text: msg.author.id});

                    answer.forEach((ans, ind) => {
                        embed.addField(`問題: ${queList[ind].question}`, `回答: ${ans}`);
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
                            /*
                        new Discord.MessageButton()
                            .setLabel('踢出')
                            .setCustomId(`verify;kick;${msg.author.id};${thread.id};${threadMsg.id}`)
                            .setStyle('DANGER'),
                            */
                    ])

                    backstage.send({embeds: [embed], components: [button]});
                } else {
                    if(verifying.findIndex((i => i === msg.author.id)) >= 0) verifying.splice(verifying.findIndex((i => i === msg.author.id)), 1);
                    msg.member.roles.add(guildData.role);
                    threadMsg.edit(
                        msg.author.toString() +
                        '\n恭喜您通過驗證，可以正式加入伺服器。\n' + 
                        'Congratulations, you have been verified and can officially join the server.'
                    );
                    backstage.send(`${msg.author} (${msg.author.id}) 驗證自動通過。`);
                    thread.delete();

                }
            }
        });

        collector.on('end', (c, r) => {
            if(r === 'time') {
                if(verifying.findIndex((i => i === msg.author.id)) >= 0) verifying.splice(verifying.findIndex((i => i === msg.author.id)), 1);
                threadMsg.edit(
                    msg.author.toString() + 
                    '\n逾時，驗證失敗。請輸入`.verify`重新開始驗證。\n' + 
                    'Timeout, verification failed. Please type `.verify` to restart the verification again.'
                );
                thread.delete();
            }
            
        })
    }
}