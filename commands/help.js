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
            .addField('.setting', '功能設定。以下為功能一覽。')
            //.addField('.setting welcome-message <message>\n.setting wm <message>', '設定歡迎訊息。')
            .addField('.setting verify-channel <channel>\n.setting vc <channel>', 
                '設定驗證頻道。用戶進入伺服器後將在此發送驗證訊息，\`.verify\`指令也只能在這個頻道使用。')
            .addField('.setting backstage-channel <channel>\n.setting bc <channel>', 
                '設定後台頻道，進行人工驗證與訊息發送。')
            .addField('.setting add-question <question>;<ans1>;<ans2>...\n.setting aq <question>;<ans1>;<ans2>...', 
                '設定驗證問題。問題與答案(可複數)需要用分號分開。')
            .addField('.setting show-question\n.setting sq', '顯示所有驗證問題。')
            .addField('.setting delete-question\n.setting dq', '刪除驗證問題。要刪除的問題在輸入指令後選擇。')
            .addField('.setting question-amount <amount>\n.setting qa <amount>', 
                '設定要產生的問題總數。產生的問題將會隨機抽取直到達到設定的總數，或者當設定為0時會依序詢問所有問題。')
            .addField('.setting endow-role <role>\n.setting er <role>', '設定通過驗證後會賦予被驗證者的身分組。')
            .addField('.setting open', 
                '開啟系統。需要先行設定驗證頻道、後台頻道、至少一個驗證問題及賦予身分組才能開啟。\
                設為開啟時，加入伺服器或輸入指令\`.verify\`會開啟驗證程序。')
            .addField('.setting close', '關閉系統。')
            .setFooter({text: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({dynamic: true})}`})
            .setTimestamp()
        msg.reply({
            embeds: [embed],
            allowedMentions: {repliedUser: false}
        })
    }
}