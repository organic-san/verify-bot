const Discord = require('discord.js');
const fs = require('fs');
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

let isready = false;

client.on('ready', () =>{
    console.log(`登入成功: ${client.user.tag} 於 ${new Date()}`);
    //client.user.setActivity('/help'/*, { type: 'PLAYING' }*/);

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

});

client.on('messageCreate', async msg =>{
    if(!isready) return;
    if(!msg.guild || !msg.member) return; //訊息內不存在guild元素 = 非群組消息(私聊)
    if(msg.webhookId) return;

    if(msg.content.startsWith('.')) {
        let commandName = msg.content.slice(1);
        const command = client.commands.get(commandName);
	    if (!command) return;
        console.log('isMsgCommand: ' + commandName + ', guild: ' + msg.guild.name);
        try{
            if(command.tag === 'message') await command.execute(msg, client);
        }catch(err) {
            console.log(err);msg.reply('發生意外錯誤，停止本次操作');
        }
    }

})