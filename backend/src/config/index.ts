import dotenv from 'dotenv';
import configDefault from './default';
import configDev from './development';
import configProd from './production';
import configTest from './test';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

const configMap: Record<string, any> = {
  development: configDev,
  production: configProd,
  test: configTest,
};

const config = {
  ...configDefault,
  ...configMap[env],
  env,
};

export default config;
