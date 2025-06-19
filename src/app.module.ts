import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configService } from './config/config.service';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { M1Module } from './MX/mx.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GQLErrFormatter } from '@app/gqlerr';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60, limit: 10 }] }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri:
          config.get('MONGO_CONNECTION') ||
          configService.getValue('MONGO_CONNECTION'),
        dbName: configService.getValue('MONGO_DB_NAME'),
        connectTimeoutMS: 10000,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/graphql',
      autoSchemaFile: true,
      sortSchema: true,
      introspection: true,
      playground: true,
      formatError: GQLErrFormatter,
      context: ({ req, res }) => ({ req, res }),
    }),
    TasksModule,
    AuthModule,
    UsersModule,
    M1Module,
  ],
})
export class AppModule {}
