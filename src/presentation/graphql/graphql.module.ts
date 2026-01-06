import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLFormattedError } from 'graphql';
import { MakeResolver } from './resolvers/make.resolver';
import { VehicleTypeResolver } from './resolvers/vehicle-type.resolver';
import { MakeModule } from '../../domain/make/make.module';
import { VehicleTypeModule } from '../../domain/vehicle-type/vehicle-type.module';

interface OriginalError {
  message: string;
  statusCode?: number;
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      formatError: (error): GraphQLFormattedError => {
        const originalError = error.extensions?.originalError as
          | OriginalError
          | undefined;

        return {
          message: originalError?.message ?? error.message,
          extensions: {
            code: error.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
            statusCode: originalError?.statusCode ?? 500,
          },
        };
      },
    }),
    MakeModule,
    VehicleTypeModule,
  ],
  providers: [MakeResolver, VehicleTypeResolver],
})
export class GraphqlModule {}
