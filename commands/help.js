const Discord = require('discord.js');

module.exports = {
    tag: "message",
    subCmd: false,

    /**
     * 
     * @param {Discord.Message<boolean>} msg 
     * @param {Discord.Client<boolean>} client
     */
    async execute(msg, client) {
        if(!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) return;

        const embed = new Discord.MessageEmbed()
            .setColor(process.env.EMBEDCOLOR)
            .setTitle(`${client.user.tag} 驗證功能使用說明`)
            .setDescription(`問題式驗證機器人。\n指令前輟: \`.\``)
            .addField('.help', '顯示指令功能一覽表')
            .addField('.verify', '手動開始驗證程序。')
            .addField('.setting', '功能設定。')
            //.addField('.setting welcome-message <message>\n.setting wm <message>', '設定歡迎訊息。')
            .addField('.setting verify-channel <channel>\n.setting vc <channel>', '設定驗證頻道。')
            .addField('.setting backstage-channel <channel>\n.setting bc <channel>', '設定後台頻道，進行人工驗證與訊息發送。')
            .addField('.setting add-question <question>;<ans1>;<ans2>...\n.setting aq <question>;<ans1>;<ans2>...', '設定驗證問題。問題與答案(可複數)需要用分號分開。')
            .addField('.setting show-question\n.setting sq', '顯示所有驗證問題。')
            .addField('.setting delete-question\n.setting dq', '刪除驗證問題。')
            .addField('.setting question-amount <amount>\n.setting qa <amount>', '設定要產生的問題總數。產生的問題將會隨機抽取直到達到總數。')
            .addField('.setting endow-role <role>\n.setting er <role>', '設定通過驗證後會賦予被驗證者的身分組。')
            .addField('.setting open', '開啟系統。需要先行完成驗證頻道、後台頻道、至少一個驗證問題、賦予身分組才能開啟。')
            .addField('.setting close', '關閉系統。')
            .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
            .setTimestamp()
        msg.reply({
            embeds: [embed],
            allowedMentions: {repliedUser: false}
        })
    }
}