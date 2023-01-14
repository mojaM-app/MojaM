import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

import communityRoutes from './routes/community.js'

const app = express();
const port = process.env.PORT || 5101;

app.use(cors());
app.use(bodyParser.json());
app.use('/community', communityRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});