class DateUtils {
    static formatDateBR(date) {
        return date.toLocaleDateString('pt-br');
    }
    static isSameDate(date1, date2) {
        return (date1.toDateString() === date2.toDateString());
    }

    /**
     * Check if date in this week.
     * @see https://stackoverflow.com/a/63588590
     * @author Michael Lynch
     */
    static isDateInThisWeek(date) {
        const todayObj = new Date();
        const todayDate = todayObj.getDate();
        const todayDay = todayObj.getDay();
      
        // get first date of week
        const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));
      
        // get last date of week
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
      
        // if date is equal or within the first and last dates of the week
        return date >= firstDayOfWeek && date <= lastDayOfWeek;
    }
}
module.exports = DateUtils;