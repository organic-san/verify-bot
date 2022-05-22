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
        if(verifying.includes(msg.author.id)) return msg.reply(
            '您已經開始進行驗證，請進入您的討論串繼續進行驗證程序。\n' + 
            'You have started the verification process, please go to to your verification thread to continue the verification process.'
        );
        verifying.push(msg.author.id);
        if(msg.channel.isThread()) return;
        let threadMsg = await msg.reply(
            '<@' + msg.author.id + '>\n請進入下方的討論串開始驗證程序。\n' + 
            'please join to the thread below to start the server join validation process.'
        );
        let thread = await threadMsg.startThread({name: `驗證 - ${msg.author.id}`, autoArchiveDuration: 1440});
        let queAmount = guildData.questionGenerateAmount === 0 ? guildData.questionList.length : guildData.questionGenerateAmount;
        thread.send(
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

        let collector = thread.createMessageCollector({time: 60 * 60 * 1000});

        thread.send(`${step}. ${queList[0].question}`);

        collector.on('collect', (cmsg) => {
            if(cmsg.author.id !== msg.author.id) return;
            answer.push(cmsg.content);
            step++;
            if(step <= queAmount) {
                thread.send(`${step}. ${queList[step - 1].question}`);
            } else {
                console.log(answer);
            }
        });

        collector.on('end', () => {
            
            verifying.splice(verifying.findIndex((i => i === msg.author.id)), 1);
            threadMsg.edit(
                `<@${msg.author.id}>\n` + 
                '驗證失敗，因此取消驗證，請輸入`.verify`重新開始驗證。\n' + 
                'Cancel the verification because the verification failed. Please type `.verify` to restart the verification again.'
            );
            thread.delete();
        })
    }
}