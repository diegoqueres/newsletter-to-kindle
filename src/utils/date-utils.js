class DateUtils {
    static formatDateBR(date) {
        return date.toLocaleDateString('pt-br');
    }
    static isSameDate(date1, date2) {
        return (date1.toDateString() === date2.toDateString());
    }
}
module.exports = DateUtils;