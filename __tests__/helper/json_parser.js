const jsonParser = (json_data) => {
    /** @type {CommentThreadData[]} */
    const threads = json_data.filter(value => {
        return Object.prototype.hasOwnProperty.call(value, "thread");
    });

    /** @type {CommentChatData[]} */
    const chats =  json_data.filter(value => {
        return Object.prototype.hasOwnProperty.call(value, "chat");
    });

    return {threads, chats};
};

module.exports = {
    jsonParser
};