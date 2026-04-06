process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/it_crowd_test';
process.env.PORT = process.env.PORT ?? '8000';
process.env.HOST = process.env.HOST ?? '127.0.0.1';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
process.env.LLM_MODE = process.env.LLM_MODE ?? 'mock_deterministic';
process.env.LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'openai';