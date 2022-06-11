const Discord = require('discord.js');
const fs = require('fs');
const guild = require('./functions/guildData.js');
require('dotenv').config();

const options = {
    restTimeOffset: 100,
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES
    ],
};

const client = new Discord.Client(options);
client.login(process.env.TOKEN);

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(file.slice(0, -3), command);
}

/**
 * @type {Array<string>}
 */
let verifying = [];


/**
 * @type {Map<string, guild.guildData>}
 */
const guildData = new Map();

let isready = false;

client.on('ready', () =>{
    console.log(`登入成功: ${client.user.tag} 於 ${new Date()}`);
    
    const guildDirs = fs.readdirSync('./guildData');
    client.guilds.cache.forEach(gui => {
        if(!guildDirs.includes(`${gui.id}.json`)) {
            const nGD = new guild.guildData(gui);
            guildData.set(gui.id, nGD);
            fs.writeFileSync(`./guildData/${gui.id}.json`, JSON.stringify(guildData.get(gui.id), null, '\t'));
        } else {
            let parseData = fs.readFileSync(`./guildData/${gui.id}.json`);
            parseData = JSON.parse(parseData);
            const nGD = new guild.guildData({ "id": gui.id, "name": gui.name });
            nGD.generation(parseData);
            guildData.set(gui.id, nGD);
        }
    })

    setTimeout(async () => {
        console.log(`設定成功: ${new Date()}`);
        client.channels.fetch('982831255236280360').then(channel => channel.send(`登入成功`));
        isready = true;
        
    }, parseInt(process.env.LOADTIME) * 1000);
    setInterval(() => {
        client.channels.fetch('982831255236280360').then(channel => channel.send(`alive`));
    }, 10 * 60 * 1000);
        
})

client.on('interactionCreate', async interaction => {
    if(!isready) return;
    if(!interaction.isButton()) return;
    let data = interaction.customId.split(';');
    if(data[0] !== 'verify') return;
    interaction.deferUpdate();
    if(!interaction.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) return;
    let gData = guildData.get(interaction.guild.id);
    let user = await interaction.guild.members.fetch(data[2]).catch(() => {}); 
    /**
     * @type {Discord.TextChannel}
     */
    let verifyChannel = await interaction.guild.channels.fetch(gData.verifyChannel);
    let backstageChannel = await interaction.guild.channels.fetch(gData.backstageChannel);
    let thread = await verifyChannel.threads.fetch(data[3]);
    let threadMsg = await verifyChannel.messages.fetch(data[4]);
    if(!user) {
        thread.delete().catch(() => {});
        if(verifying.findIndex((i => i === data[2])) >= 0) verifying.splice(verifying.findIndex((i => i === data[2])), 1);
        interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 用戶不存在，無法繼續驗證。`, embeds: [], components: []});
        threadMsg.edit(`<@${data[2]}>\n驗證取消。Verification cancelled.`);
        verifyChannel.send(
            `<@${data[2]}>\n` + 
            `取消驗證，因為無法確認用戶。如果您還在伺服器，請輸入\`.verify\`重新驗證。\n` + 
            `Cancel the verification because the user cannot be identified. If you are still on the server, please re-verify by entering \`.verify\`.`
        )
        return;
    }
    if(data[1] === 'pass') {
        thread.delete().catch(() => {});
        if(verifying.findIndex((i => i === data[2])) >= 0) verifying.splice(verifying.findIndex((i => i === data[2])), 1);
        let err = false;
        await user.roles.add(gData.role).catch(() => err = true);
        if(err) {
            threadMsg.edit(
                `<@${data[2]}>\n` + 
                '發生錯誤：權限不足，請聯絡管理員。\n' + 
                'Error: Permissions are not enough, please contact the administrator.'
            );
            interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 驗證過程發生錯誤：身分組權限不足。`, embeds: [], components: []});
        } else {
            threadMsg.edit(
                `<@${data[2]}>\n` + 
                '恭喜您通過驗證，可以正式加入伺服器。\n' + 
                'Congratulations, you have been verified and can officially join the server.'
            );
            interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 由 ${interaction.user} 驗證通過。`, embeds: [], components: []});
        }

    } else if(data[1] === 'fail') {
        thread.delete().catch(() => {});
        if(verifying.findIndex((i => i === data[2])) >= 0) verifying.splice(verifying.findIndex((i => i === data[2])), 1);
        threadMsg.edit(
            `<@${data[2]}>\n` + 
            '驗證失敗。Verification failed.'
        );
        if(gData.reverifyTimelimit === 0) {
            verifyChannel.send(
                `<@${data[2]}>\n` + 
                `驗證失敗，由管理員駁回。請輸入\`.verify\`重新驗證。\n` + 
                `Verification failed and was dismissed by the administrator. Please enter \`.verify\` to re-verify.`
            )
        } else {
            verifyChannel.send(
                `<@${data[2]}>\n` + 
                `驗證失敗，由管理員駁回。請在 ${gData.reverifyTimelimit} 分鐘內輸入\`.verify\`重新驗證。\n` + 
                `Verification failed and was dismissed by the administrator. Please enter \`.verify\` in ${gData.reverifyTimelimit} minute to re-verify.`
            )
        }
        interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 由 ${interaction.user} 駁回驗證。`, embeds: [], components: []});
        if(gData.reverifyTimelimit <= 0) return;
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        wait(gData.reverifyTimelimit * 60 * 1000).then(async () => {
            if(!user.manageable) return;
            if(user.roles.cache.has(gData.role)) return;
            if(verifying.findIndex((i => i === user.id)) >= 0) return;
            await user.user.send(
                `您因為太久沒有重新驗證，因此被踢出 **${interaction.guild.name}**。\n` + 
                `You have been kicked out of **${interaction.guild.name}** because you have not re-validated for too long.`
            ).catch(() => {});
            await user.kick().catch(() => {});
            backstageChannel.send(`${user} (${user.id}) 因為太久沒有重新驗證而被踢出。`);
        })

    } else if(data[1] === 'kick') {
        if(!user.kickable) return interaction.message.edit({content: `錯誤：權限不足，無法踢出此用戶。`});
        if(verifying.findIndex((i => i === data[2])) >= 0) verifying.splice(verifying.findIndex((i => i === data[2])), 1);
        thread.delete().catch(() => {});
        threadMsg.edit(
            `<@${data[2]}>\n` + 
            '驗證失敗。Verification failed.'
        );
        await user.user.send(
            `管理員駁回了您的申請，因此您被踢出 **${interaction.guild.name}**。\n` + 
            `The administrator rejected your request, so you were kicked from **${interaction.guild.name}**.`
        ).catch(() => {});
        await user.kick().catch(() => {});
        interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 由 ${interaction.user} 踢出伺服器。`, embeds: [], components: []});
    }

});

client.on('messageCreate', async msg =>{
    if(!isready) return;
    if(!msg.guild || !msg.member) return; //訊息內不存在guild元素 = 非群組消息(私聊)
    if(msg.webhookId) return;

    if(msg.channel.isThread()) {
        if(msg.author.id !== client.user.id) {
            if(msg.channel.name.startsWith('驗證'))
                if(msg.deletable) msg.delete().catch(()=> {});
        }
    } else {
        let gd = guildData.get(msg.guild.id);
        if(msg.author.id !== client.user.id) {
            if(gd.isWorking) {
                if(gd.verifyChannel === msg.channel.id) {
                    if(msg.deletable) msg.delete().catch(()=> {});
                }
            }
        }
    }

    //if(msg.content === 't') console.log(verifying);

    if(msg.channel.isThread()) return;

    if(msg.content.startsWith('.')) {
        let commandName = msg.content.slice(1).split(/\s+/)[0];
        const command = client.commands.get(commandName);
	    if (!command) return;
        if(command.subCmd) commandName += ('/' + msg.content.slice(1).split(/\s+/)[1]);
        let now = new Date(Date.now());
        let timeNow = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        console.log(timeNow + ' isMsgCommand: ' + commandName + ', guild: ' + msg.guild.name);
        try{
            if(command.tag === 'message') await command.execute(msg, client);
            if(command.tag === 'guildData') await command.execute(msg, client, guildData.get(msg.guild.id));
            if(command.tag === 'guildDataverifing') await command.execute(msg, client, guildData.get(msg.guild.id), verifying);
        }catch(err) {
            console.log(err);msg.channel.send(msg.author.toString() + ' 發生意外錯誤，停止本次操作，請聯繫管理員。');
        }
    }

})

client.on('guildMemberAdd', async member => {
    if(!isready) return;
    if(member.user.bot) return;
    let gData = guildData.get(member.guild.id);
    /**
     * @type {Discord.TextChannel}
     */
    let verifyChannel = await member.guild.channels.fetch(gData.verifyChannel);
    let backstage = await member.guild.channels.fetch(gData.backstageChannel);

    //全踢出
    if(gData.allKick) {
        let now = new Date(Date.now());
        let timeNow = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        console.log(timeNow + ' all-kicking, guild: ' + member.guild.name);
        if(!member.kickable) backstage.send({content: `錯誤：權限不足，無法踢出 ${member}。`});
        else {
            await member.send(
                `非常抱歉，由於目前正在整理伺服器，因此暫時不開放加入 **${member.guild}**。預計於數日內重新開放加入伺服器。\n` + 
                `Sorry, we are currently in the process of organizing the server, so we are temporarily closed to join **${member.guild}**. ` + 
                `We expect to reopen the server in a few days.`
            ).catch(() => {});
            await member.kick().catch(() => {});
            backstage.send({content: `自動踢出 ${member}。`});
        }
        return;
    }
    //全踢出結束
    
    if(!gData.isWorking) return;
    if(verifying.includes(member.id)) return verifyChannel.send(
        member.toString() + '您已經開始進行驗證，請進入您的討論串繼續進行驗證程序。\n' + 
        'You have started the verification process, please go to to your verification thread to continue the verification process.'
    );
    verifying.push(member.id);
    backstage.send(`${member} (${member.id}) 自動開始驗證程序。`);
    let now = new Date(Date.now());
    let timeNow = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    console.log(timeNow + ' auto-verifying, guild: ' + member.guild.name);
    let threadMsg = await verifyChannel.send(
        member.toString() + '\n請進入下方的討論串開始驗證程序。\n' + 
        'please join to the thread below to start the server join validation process.'
    );
    let thread = await threadMsg.startThread({name: `驗證 - ${member.id}`, autoArchiveDuration: 1440, rateLimitPerUser: 5});
    let queAmount = gData.questionGenerateAmount === 0 ? gData.questionList.length : gData.questionGenerateAmount;
    await thread.send(
        '請回答管理員提出的問題，以協助他們審核你的伺服器加入申請。' + 
        '只有管理員和伺服器擁有者會看見你的回答。' + 
        '一共有 ' + queAmount + ' 個問題，請在問題下方輸入您的回答，並在 ' + gData.verifyTimelimit + ' 分鐘前完成驗證。\n' + 
        'Please answer the questions asked by the administrators to help them review your server membership application. ' + 
        'Only administrators and server owners will see your answers. ' + 
        'There are a total of ' + queAmount + ' questions, please enter your answer below the question and complete the verification before ' + 
        gData.verifyTimelimit + ' minutes.'
    );
    
    /**
     * @type {Array<{question: string, answer: string[]}>}
     */
    let queList = [];
    if(gData.questionGenerateAmount !== 0) {
        let perList = [];
        gData.questionList.forEach(q => perList.push(q));
        for(let i = 0; i < gData.questionGenerateAmount; i ++) {
            let random = Math.floor(Math.random() * perList.length);
            queList[i] = perList[random];
            perList.splice(random, 1);
        }
    } else {
        gData.questionList.forEach(q => queList.push(q));
    }

    let step = 1;
    let answer = [];

    await thread.send(`${step}. ${queList[0].question}`);

    let collector = thread.createMessageCollector({time: (gData.verifyTimelimit === 0 ? 60 : gData.verifyTimelimit) * 60 * 1000});

    collector.on('collect', async (cmsg) => {
        //if(cmsg.deletable) cmsg.delete().catch(() => {});
        if(cmsg.author.id !== member.id) return;
        answer.push(cmsg.content);
        step++;
        if(step <= queAmount) {
            thread.send(`${step}. ${queList[step - 1].question}`);
        } else {
            if(step > queAmount + 1) return;
            let inspection = 0;
            answer.forEach((ans, ind) => {
                if(!queList[ind].answer.includes(ans)) inspection++;
            })
            if(inspection > 0) {
                thread.send('已確認您的回答，請等待管理員審核。\nYour answer has been confirmed, please wait for the administrator to review it.');
                let embed = new Discord.MessageEmbed()
                .setColor(process.env.EMBEDCOLOR)
                .setTitle('驗證問題回答結果')
                .setAuthor({name: `${member.user.tag}`, iconURL: member.displayAvatarURL({dynamic: true})})
                .setTimestamp()
                .setFooter({text: 'user Id: ' +  member.id});

                answer.forEach((ans, ind) => {
                    embed.addField(`問題: ${queList[ind].question}`, `回答: ${ans}`);
                })
                let button = new Discord.MessageActionRow().addComponents([
                    new Discord.MessageButton()
                        .setLabel('通過')
                        .setCustomId(`verify;pass;${member.id};${thread.id};${threadMsg.id}`)
                        .setStyle('SUCCESS'),
                    new Discord.MessageButton()
                        .setLabel('駁回')
                        .setCustomId(`verify;fail;${member.id};${thread.id};${threadMsg.id}`)
                        .setStyle('PRIMARY'),
                    new Discord.MessageButton()
                        .setLabel('踢出')
                        .setCustomId(`verify;kick;${member.id};${thread.id};${threadMsg.id}`)
                        .setStyle('DANGER'),
                ])

                backstage.send({embeds: [embed], components: [button]});
            } else {
                thread.delete();
                if(verifying.findIndex((i => i === member.id)) === -1) return threadMsg.edit(
                    member.toString() + 
                    '\n驗證取消。\n' + 
                    'Verification cancelled.'
                );
                verifying.splice(verifying.findIndex((i => i === member.id)), 1);
                let err = false;
                await member.roles.add(gData.role).catch(() => err = true);
                if(err) {
                    threadMsg.edit(
                        member.toString() +
                        '\n發生錯誤：權限不足，請聯絡管理員。\n' + 
                        'Error: Permissions are not enough, please contact the administrator.'
                    );
                    backstage.send(`${member} (${member.id}) 驗證過程發生錯誤：身分組權限不足。`);
                } else {
                    threadMsg.edit(
                        member.toString() +
                        '\n恭喜您通過驗證，可以正式加入伺服器。\n' + 
                        'Congratulations, you have been verified and can officially join the server.'
                    );
                    backstage.send(`${member} (${member.id}) 驗證自動通過。`);
                }

            }
            collector.stop('end');
        }
    });

    collector.on('end', async (c, r) => {
        if(r === 'time') {
            thread.delete();
            if(verifying.findIndex((i => i === member.id)) === -1) return threadMsg.edit(
                member.toString() + 
                '\n驗證取消。\n' + 
                'Verification cancelled.'
            );
            verifying.splice(verifying.findIndex((i => i === member.id)), 1);
            if(gData.verifyTimelimit === 0) {
                threadMsg.edit(
                    member.toString() + 
                    '\n逾時，驗證失敗。請輸入`.verify`重新開始驗證。\n' + 
                    'Timeout, verification failed. Please type `.verify` to restart the verification again.'
                );
                backstage.send(`${member} (${member.id}) 驗證因逾時而取消。`);
            } else {
                threadMsg.edit(
                    member.toString() + 
                    '\n逾時，驗證失敗。\n' + 
                    'Timeout, verification failed.'
                );
                if(!member.kickable) return backstage.send({content: `錯誤：權限不足，無法在驗證逾時後踢出 ${member}。`});
                await member.send(
                    `由於您未在時間限制內完成驗證，因此您被踢出 **${member.guild.name}**。\n` + 
                    `You have been kicked from **${member.guild.name}** because you did not complete the verification within the time limit.`
                ).catch(() => {});
                await member.kick().catch(() => {});
                backstage.send(`${member} (${member.id}) 因為驗證逾時而被踢出。`);
            }
        }
    })
})