import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '비바타운 서버가 정상 작동중입니다.' });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: '비바타운 API 테스트',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`🌐 http://localhost:${PORT}`);
});