import { env } from './app/env';
import createExpressApp from 'express';
import { corsMiddleware } from './app/middleware/corsMiddleware';
import { contextMiddleware } from './app/middleware/contextMiddleware';
import { accountMiddleware } from './app/middleware/accountMiddleware';
import * as http from 'http';
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPluginDrainHttpServer,
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginUsageReporting,
} from 'apollo-server-core';
import { schema } from './graphql_schema_generated';
import { resolvers } from './app/resolvers';
import { redis } from './modules/cache/redis';

async function startServer() {
    const app = createExpressApp();
    app.use(corsMiddleware);
    app.use(contextMiddleware);
    app.use(accountMiddleware);

    const httpServer = http.createServer(app);
    const server = new ApolloServer({
        resolvers: resolvers,
        typeDefs: schema,
        introspection: true,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            ApolloServerPluginLandingPageGraphQLPlayground(),
            /*ApolloServerPluginUsageReporting({
                sendVariableValues: { all: true },
                sendHeaders: { onlyNames: ['AccountAddress'] },
            }),*/
        ],
        context: ({ req }) => req.context,
    });
    await server.start();
    server.applyMiddleware({ app });

    await redis.connect();

    await new Promise<void>((resolve) => httpServer.listen({ port: env.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${env.PORT}${server.graphqlPath}`);
}

startServer().finally(async () => {});
