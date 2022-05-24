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
    console.log(data)
    if(data[0] !== 'verify') return;
    if(data[1] === 'pass') {


    } else if(data[1] === 'fail') {

    } else if(data[1] === 'kick') {

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
    let gData = guildData.get(member.guild.id);

    if(!gData.isWorking) return;
    
})