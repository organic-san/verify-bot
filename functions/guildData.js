const Discord = require('discord.js');

class GuildData {

    /**
     * 
     * @param {Discord.Guild} guild
     */
    constructor(guild) {
        this.id = guild.id;
        this.name = guild.name;
        this.welcomeMessage = '';
        this.welcomeMessageChannel = '';
        this.verifyMessage = '';
        this.verifyChannel = '';
        this.backstageChannel = '';
        this.role = '';
        /**
         * @type {Array<{question: string, answer: string[]}>}
         */
        this.questionList = [];
        this.questionGenerateAmount = 0;
        this.isRandonQuestion = true;
        this.verifyTimelimit = 0;

        this.isWorking = false;
    }

    /**
     * 
     * @param {Object} obj 
     */
    generation(obj) {
        //this.id = obj.id;
        //this.name = obj.name;
        this.welcomeMessage = obj.welcomeMessage ?? '';
        this.welcomeMessageChannel = obj.welcomeMessageChannel ?? '';
        this.verifyMessage = obj.verifyMessage ?? '';
        this.verifyChannel = obj.verifyChannel ?? '';
        this.backstageChannel = obj.backstageChannel ?? '';
        this.role = obj.role ?? '';

        this.questionList = obj.questionList ?? [];
        this.questionGenerateAmount = obj.questionGenerateAmount ?? 0;
        this.isRandonQuestion = obj.isRandonQuestion ?? true;
        this.verifyTimelimit = obj.verifyTimelimit ?? 0;

        this.isWorking = obj.isWorking ?? false;
    }

    /*
    toJSON() {
        return {
            "id": this.id,
            "name": this.name,
            "welcomeMessage": this.welcomeMessage,
            "welcomeMessageChannel": this.welcomeMessageChannel,
            "verifyMessage": this.verifyMessage,
            "verifyChannel": this.verifyChannel,
            "role": this.role,
            "backstageChannel": this.backstageChannel,
            'questionList': this.questionList,
            'questionGenerateAmount': this.questionGenerateAmount,
            'isRandonQuestion': this.isRandonQuestion,

            'isWorking': this.isWorking,
        }
    }
    */

}

module.exports.guildData = GuildData;