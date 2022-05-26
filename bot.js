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
        //TODO: 除錯用資料傳送處理
        /*
        client.channels.fetch(process.env.CHECK_CH_ID).then(channel => channel.send(`登入成功: <t:${Math.floor(client.readyTimestamp / 1000)}:F>`));
        if(client.user.id !== process.env.BOT_ID_ACIDTEST)
            client.channels.fetch(process.env.CHECK_CH_ID2).then(channel => channel.send(`登入成功: <t:${Math.floor(client.readyTimestamp / 1000)}:F>`));
        */
        isready = true;
        
    }, parseInt(process.env.LOADTIME) * 1000);
})

client.on('interactionCreate', async interaction => {
    if(!isready) return;
    if(!interaction.isButton()) return;
    let data = interaction.customId.split(';');
    if(data[0] !== 'verify') return;
    interaction.deferUpdate();
    let gData = guildData.get(interaction.guild.id);
    let user = await interaction.guild.members.fetch(data[2]); 
    /**
     * @type {Discord.TextChannel}
     */
    let verifyChannel = await interaction.guild.channels.fetch(gData.verifyChannel);
    let backstageChannel = await interaction.guild.channels.fetch(gData.backstageChannel);
    let thread = await verifyChannel.threads.fetch(data[3]);
    let threadMsg = await verifyChannel.messages.fetch(data[4]);
    if(!user) {
        interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 用戶不存在，無法繼續驗證。`, embeds: [], components: []});
        backstageChannel.send(`<@${data[2]}> (${data[2]}) 用戶不存在，無法繼續驗證。`);
        threadMsg.edit(`<@${data[2]}>\n驗證取消。Verification cancelled.`);
        verifyChannel.send(
            `<@${data[2]}>\n` + 
            `取消驗證，因為無法確認用戶。如果您還在伺服器，請輸入\`.verify\`重新驗證。\n` + 
            `Cancel the verification because the user cannot be identified. If you are still on the server, please re-verify by entering \`.verify\`.`
        )
        return;
    }
    if(data[1] === 'pass') {
        if(verifying.findIndex((i => i === data[2])) >= 0) verifying.splice(verifying.findIndex((i => i === data[2])), 1);
        thread.delete().catch(() => {});
        user.roles.add(gData.role);
        threadMsg.edit(
            `<@${data[2]}>\n` + 
            '恭喜您通過驗證，可以正式加入伺服器。\n' + 
            'Congratulations, you have been verified and can officially join the server.'
        );
        interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 由 ${interaction.user} 驗證通過。`, embeds: [], components: []});

    } else if(data[1] === 'fail') {
        if(verifying.findIndex((i => i === data[2])) >= 0) verifying.splice(verifying.findIndex((i => i === data[2])), 1);
        thread.delete().catch(() => {});
        threadMsg.edit(
            `<@${data[2]}>\n` + 
            '驗證失敗。Verification failed.'
        );
        verifyChannel.send(
            `<@${data[2]}>\n` + 
            `驗證失敗，由管理員駁回。請輸入\`.verify\`重新驗證。\n` + 
            `Verification failed and was dismissed by the administrator. Please enter \`.verify\` to re-verify.`
        )
        interaction.message.edit({content: `<@${data[2]}> (${data[2]}) 由 ${interaction.user} 駁回驗證。`, embeds: [], components: []});


    } else if(data[1] === 'kick') {
        //TODO: 待保留
    }

});

client.on('messageCreate', async msg =>{
    if(!isready) return;
    if(!msg.guild || !msg.member) return; //訊息內不存在guild元素 = 非群組消息(私聊)
    if(msg.webhookId) return;

    if(msg.content.startsWith('.')) {
        let commandName = msg.content.slice(1).split(/\s+/)[0];
        const command = client.commands.get(commandName);
	    if (!command) return;
        if(command.subCmd) commandName += ('/' + msg.content.slice(1).split(/\s+/)[1]);
        console.log('isMsgCommand: ' + commandName + ', guild: ' + msg.guild.name);
        try{
            if(command.tag === 'message') await command.execute(msg, client);
            if(command.tag === 'guildData') await command.execute(msg, client, guildData.get(msg.guild.id));
            if(command.tag === 'guildDataverifing') await command.execute(msg, client, guildData.get(msg.guild.id), verifying);
        }catch(err) {
            console.log(err);msg.reply('發生意外錯誤，停止本次操作');
        }
    }

})

client.on('guildMemberAdd', async member => {
    if(!isready) return;
    let gData = guildData.get(member.guild.id);
    /**
     * @type {Discord.TextChannel}
     */
    let verifyChannel = await member.guild.channels.fetch(gData.verifyChannel);
    if(!gData.isWorking) return;
    verifying.push(member.id);
    let backstage = await member.guild.channels.fetch(gData.backstageChannel);
    backstage.send(`${member} (${member.id}) 自動開始驗證程序。`);
    let threadMsg = await verifyChannel.send(
        member.toString() + '\n請進入下方的討論串開始驗證程序。\n' + 
        'please join to the thread below to start the server join validation process.'
    );
    let thread = await threadMsg.startThread({name: `驗證 - ${member.id}`, autoArchiveDuration: 1440});
    let queAmount = gData.questionGenerateAmount === 0 ? gData.questionList.length : gData.questionGenerateAmount;
    await thread.send(
        '請回答管理員提出的問題，以協助他們審核你的伺服器加入申請。只有管理員和伺服器擁有者會看見你的回答。一共有 ' + queAmount + ' 個問題，請在問題下方輸入您的回答。\n' + 
        'Please answer the question(s) asked by the administrators to help them review your server join application. Only the administrator and the server owner will see your answers. Please enter your answer below question.。\n' + 
        'There are ' + queAmount + ' question(s) in total.'
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

    let collector = thread.createMessageCollector({time: 60 * 60 * 1000});

    collector.on('collect', (cmsg) => {
        if(cmsg.author.id !== member.id) return;
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
                .setAuthor({name: `${member.tag}`, iconURL: member.displayAvatarURL({dynamic: true})})
                .setTimestamp()
                .setFooter({text: member.id});

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
                        /*
                    new Discord.MessageButton()
                        .setLabel('踢出')
                        .setCustomId(`verify;kick;${member.id};${thread.id};${threadMsg.id}`)
                        .setStyle('DANGER'),
                        */
                ])

                backstage.send({embeds: [embed], components: [button]});
            } else {
                if(verifying.findIndex((i => i === member.id)) >= 0) verifying.splice(verifying.findIndex((i => i === member.id)), 1);
                member.roles.add(gData.role);
                threadMsg.edit(
                    member.toString() +
                    '\n恭喜您通過驗證，可以正式加入伺服器。\n' + 
                    'Congratulations, you have been verified and can officially join the server.'
                );
                backstage.send(`${member} (${member.id}) 驗證自動通過。`);
                thread.delete();

            }
        }
    });

    collector.on('end', (c, r) => {
        if(r === 'time') {
            if(verifying.findIndex((i => i === member.id)) >= 0) verifying.splice(verifying.findIndex((i => i === member.id)), 1);
            threadMsg.edit(
                member.toString() + 
                '\n逾時，驗證失敗。請輸入`.verify`重新開始驗證。\n' + 
                'Timeout, verification failed. Please type `.verify` to restart the verification again.'
            );
            thread.delete();
        }
        
    })
    
})