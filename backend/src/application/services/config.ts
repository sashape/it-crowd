import dotenv from 'dotenv';
import { ConfigSchema } from '~/domain/schemas.js';

dotenv.config();

export const appConfig = ConfigSchema.parse(process.env);