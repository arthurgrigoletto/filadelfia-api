import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import * as redisStore from 'cache-manager-redis-store';

require('dotenv').config();

class ConfigService {

  constructor(private env: { [k: string]: string | undefined }) { }

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach(k => this.getValue(k, true));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public isProduction() {
    const mode = this.getValue('NODE_ENV', false);
    return mode != 'DEV';
  }

  public getSequelizeConfig(): SequelizeModuleOptions {
    return {
      dialect: 'postgres',
      host: this.getValue('POSTGRES_HOST'),
      port: parseInt(this.getValue('POSTGRES_PORT')),
      username: this.getValue('POSTGRES_USER'),
      password: this.getValue('POSTGRES_PASSWORD'),
      database: this.getValue('POSTGRES_DATABASE'),
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
      },
    }
  }

  public getRedisConfig() {
    return {
      store: redisStore,
      host: this.getValue('REDIS_HOST'),
      port: this.getValue('REDIS_PORT')
    }
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',

      host: this.getValue('POSTGRES_HOST'),
      port: parseInt(this.getValue('POSTGRES_PORT')),
      username: this.getValue('POSTGRES_USER'),
      password: this.getValue('POSTGRES_PASSWORD'),
      database: this.getValue('POSTGRES_DATABASE'),
      logging: false,
      entities: this.isProduction() ? ['dist/**/*.entity.js'] : ['src/**/*.entity.{ts,js}'],
      migrationsTableName: 'migration',
      migrations: this.isProduction() ? ['dist/database/migration/*.js'] : ['src/database/migration/*.ts'],
      cli: {
        migrationsDir: 'src/database/migration',
      },
    };
  }

}

const configService = new ConfigService(process.env)
  .ensureValues([
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE'
  ]);

export { configService };
