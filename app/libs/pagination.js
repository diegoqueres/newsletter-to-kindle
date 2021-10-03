class Pagination {
    static getPagingDataForSingle(singleObject, page, limit) {
        const rows = [];
        if (page == 0 && singleObject !== null)
            rows.push(singleObject);
        const data = { count: 1, rows };
        return Pagination.getPagingData(data, page, limit);
    }
    static getPagingData(data, page, limit) {
        const { count: totalItems, rows } = data;
        const currentPage = page ? page : 1;
        const totalPages = Math.ceil(totalItems / limit);
        return { totalItems, rows, totalPages, currentPage };
    }
    static getPage(inputPage) {
        let page = inputPage - 1;
        page = (page < 0) ? 0 : page;
        return page;
    }
    static getFilter(query) {
        const size = query.size ? parseInt(query.size) : 25;
        const page = query.page ? parseInt(query.page) : 0;
        return {size, page};
    }
}
module.exports = Pagination;