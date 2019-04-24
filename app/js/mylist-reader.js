
/**
 * 
 * @param {strng} xml 
 */
const p = (xml) => {
    const pe = new DOMParser();
    const doc = pe.parseFromString(xml, "application/xml").documentElement;
    
    const title = doc.querySelector("channel > title").textContent;
    const link = doc.querySelector("channel > link").textContent;
    const description = doc.querySelector("channel > description").textContent;
    const creator = doc.querySelector("channel > dc:creator").textContent;

    const items = 
        Array.from(doc.querySelectorAll("channel > item")).map(item => {
            return {
                title: item.querySelector("title").textContent,
                link: item.querySelector("link").textContent,
                pubDate: item.querySelector("pubDate").textContent,
                description: item.querySelector("description").textContent
            };
        });
};