require('dotenv').config();

const express = require('express');
const port = process.env.PORT || 8080;

(async () => {
    const app = express();
    const router = express.Router();

    router.get('/', (req, res) => {
        res.send('<h1>Newsletter to kindle is running</h1>');
    });

    app.use('/', router);
    app.listen(port);
    console.log(`Listening on port ${port}`);

})();