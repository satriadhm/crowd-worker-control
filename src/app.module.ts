import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { configService } from './config/config.service';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { WorkersModule } from './users/workers.module';
import { M1Module } from './M1/m1.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    MongooseModule.forRoot(configService.getEnvValue('MONGO_CONNECTION'), {
      dbName: configService.getEnvValue('MONGO_DB_NAME'),
      connectTimeoutMS: 10000,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
    TasksModule,
    AuthModule,
    WorkersModule,
    M1Module,
  ],
})
export class AppModule {}
