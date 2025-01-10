import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configService } from './config/config.service';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { WorkersModule } from './users/users.module';
import { M1Module } from './M1/m1.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GQLErrFormatter } from '@app/gqlerr';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri:
          config.get('DATABASE_URL') || configService.getValue('DATABASE_URL'),
        dbName: 'db_crowd_worker_control',
        connectTimeoutMS: 10000,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      introspection: true,
      playground: true,
      formatError: GQLErrFormatter,
    }),
    TasksModule,
    AuthModule,
    WorkersModule,
    M1Module,
  ],
})
export class AppModule {}
