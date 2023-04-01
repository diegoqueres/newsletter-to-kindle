class StringUtils {
    static isEmpty(str) {
        return (                                                           
            (typeof str == 'undefined')
                ||
            (str == null)
                ||
            (str == false)        //same as: !x
                ||
            (str.length == 0)
                ||
            (str == 0)            // note this line, you might not need this. 
                ||
            (str == "")
                ||
            (str.replace(/\s/g,"") == "")
                ||
            (!/[^\s]/.test(str))
                ||
            (/^\s*$/.test(str))
        );
    }
}
module.exports = StringUtils;