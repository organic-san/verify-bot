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
        /**
         * @type {Map<number, {question: string, answer: string[]}>}
         */
        this.question = new Map();
        /**
         * @type {Array<number>}
         */
        this.questionList = [];
        this.questionAmount = 0;
        this.isRandonQuestion = false;

        this.isWorking = false;
    }

    /**
     * 
     * @param {Object} obj 
     */
    generation(obj) {

    }

    toJSON() {
        return {

        }
    }

}

module.exports.guildData = GuildData;