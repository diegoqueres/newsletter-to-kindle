require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 8080;

const app = express();
const router = express.Router();

router.get('/', (req, res) => {
    const html = '<h3>Kindle periodical sender is running</h3>';
    res.send(html);
})
 
app.use('/', router);
app.listen(port);