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
            .setDescription(`指令前輟: \`.\``)
            .addField('.help', '顯示指令功能一覽表')
            .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
            .setTimestamp()
        msg.reply({
            embeds: [embed],
            allowedMentions: {repliedUser: false}
        })
    }
}