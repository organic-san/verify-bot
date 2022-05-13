const Discord = require('discord.js');

module.exports = {
    tag: "message",

    /**
     * 
     * @param {Discord.Message<boolean>} msg 
     * @param {Discord.Client<boolean>} client
     */
    async execute(msg, client) {
        const embed = new Discord.MessageEmbed()
            .setColor(process.env.EMBEDCOLOR)
            .setTitle(`${client.user.tag} 驗證功能使用說明`)
            .setDescription(`問題式驗證機器人。\n指令前輟: \`.\``)
            .addField('.help', '顯示指令功能一覽表')
            .addField('.setting', '功能設定')
            //.addField('.setting welcomemessage <message>\n.setting wm <message>', '設定歡迎訊息。')
            .addField('.setting verifychannel <channel>\n.setting vc <channel>', '設定驗證頻道。')
            .addField('.setting addquestion <question>;<ans1>;<ans2>...\n.setting aq <question>;<ans1>;<ans2>...', '設定驗證問題。問題與答案(可複數)需要用分號分開。')
            .addField('.setting showquestion \n.setting sq', '顯示所有問題。')
            .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
            .setTimestamp()
        msg.reply({
            embeds: [embed],
            allowedMentions: {repliedUser: false}
        })
    }
}