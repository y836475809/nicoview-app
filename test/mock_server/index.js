
module.exports = () => {
    const total_pages = 10;
    const limt = 32;
    const total_count = 1000;
    const result = {
        data: []
    };
    for (let i = 0; i < total_pages; i++) {
        const search_result = {
            meta: {
                totalCount: total_count
            },
            data: []
        };
        for (let j = 0; j < limt; j++) {
            search_result.data.push({
                thumbnailUrl: `http://localhost:3001/img${Math.floor(Math.random() * 6)}.jpeg`,
                contentId: `sm${limt * i + j}`,
                title: `user${limt * i + j}`,
                tags: "tag1, tsg2 tag3",
                viewCounter: Math.floor(Math.random() * 100),
                commentCounter: Math.floor(Math.random() * 100),
                lengthSeconds: Math.floor(Math.random() * 300),
                startTime: "2010-10-01T20:28:02+09:00"
            });
        }
        result[`data${i}`] = search_result;
    }
    return result;
};