class ArrayUtils {
    static isStringArr(arr) {
        if (!arr || arr == null || arr.length === 0)
            return false;

        let isStringArr = false;
        for (const el of arr) {
            if (typeof el === 'string' || el instanceof String) {
                isStringArr = true;
            } else {
                isStringArr = false;
                break;
            }
        }

        return isStringArr;
    }
}
module.exports = ArrayUtils;