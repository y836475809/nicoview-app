
module.exports = () => {
    const total_count = 1000;
    const result = {
        data: []
    };
    for (let i = 0; i < 10; i++) {
        const search_result = {
            meta: {
                totalCount: total_count
            },
            data: []
        };
        for (let j = 0; j < 32; j++) {
            search_result.data.push({
                thumbnailUrl: `http://localhost:3001/img${Math.floor(Math.random() * 6)}.jpeg`,
                contentId: `sm${32 * i + j}`,
                title: `user${32 * i + j}`,
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