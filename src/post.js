class Post {
    static PERIODICITY = {
        LAST: 1,
        DAILY: 2,
        WEEKLY: 3
    }

    constructor(data) {
        this.title = data.title;
        this.author = data.author;
        this.date = data.date;
        this.link = data.link;
        this.description = data.description;
        this.periodicity = data.periodicity;
    }

    get content() {
        return this._content;
    }
    set content(content) {
        this._content = content; 
    }
    get htmlContent() {
        return this._htmlContent;
    }
    set htmlContent(htmlContent) {
        this._htmlContent = htmlContent; 
    }    

}
module.exports = Post;