// src/config/config.service.ts

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  public getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public isProduction() {
    const mode = this.getValue('MODE', false);
    return mode != 'DEV';
  }

  public getEnvValue(key: string, throwOnMissing = true) {
    return this.getValue(key, throwOnMissing);
  }
}

const configService = new ConfigService(process.env).ensureValues([
  'PORT',
  'MONGO_CONNECTION',
  'MONGO_DB_NAME',
  'SECRET_KEY',
  'MX_THRESHOLD',
]);

export { configService };
