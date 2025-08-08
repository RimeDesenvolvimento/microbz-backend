import app from './config/app';
import dotenv from 'dotenv';
dotenv.config();

app.listen(3000, () => console.log('Server running at: http://localhost:3000'));
