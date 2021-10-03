require("dotenv").config();
const jwt = require('jsonwebtoken');

class Jwt {
    static verify(req, res, next){
        const token = req.headers['x-access-token'];   
        if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
        
        jwt.verify(token, process.env.API_SECRET, function(err, decoded) {
            if (err) return res.status(401).json({ auth: false, message: 'Failed to authenticate token.' });
            req.userId = decoded.userId;        // salva dados de payload no request para uso posterior
            next();
        });
    }
}

module.exports = Jwt;