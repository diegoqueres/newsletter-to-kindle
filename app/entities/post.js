class Post {
    constructor(data) {
        this.title = data.title;
        this.author = data.author;
        this.date = data.date;
        this.link = data.link;
        this.description = data.description;
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