import express from "express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import http from "http";
import { ApolloServerPluginLandingPageProductionDefault } from "@apollo/server/plugin/landingPage/default";
import jwt from "jsonwebtoken";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import dotenv from "dotenv";
dotenv.config();
const whiteListRequest = [
  "IntrospectionQuery",
  "User_login",
  "Genders",
  "User_save",
  "Rols",
  "Company_save",
  "Companies",
  "User_register",
  "Gender_save",
  "Rol_save",
];

export async function startApolloServer(typeDefs, resolvers) {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const app = express();
  const httpServer = http.createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });
  const serverCleanup = useServer(
    {
      schema,
      context: (ctx) => {
        const { connectionParams } = ctx;
        //console.log("---5-5-5---",connectionParams);
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: "bounded",
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageProductionDefault({
        embed: true,
      }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();

  app.use(graphqlUploadExpress(), express.static("public"));

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        let { operationName, query } = req.body;
        let session = {};
        let queryRequest = query.split("\n")[1].trim();
        if (queryRequest.includes("(")) {
          queryRequest = queryRequest.substring(0, queryRequest.indexOf("("));
        } else {
          queryRequest = queryRequest.substring(0, queryRequest.indexOf(" "));
        }
        const allowedOperation =
          whiteListRequest.includes(queryRequest) ||
          whiteListRequest.includes(operationName);
        //console.log("allowedOperation",allowedOperation);
        if (!allowedOperation) {
          const { authorization } = req.headers;
          const decoded = jwt.verify(authorization, process.env.SECRET);
          if (decoded) {
            session = decoded;
          }
        }
        return { session };
      },
    })
  );
  await new Promise((resolve) =>
    httpServer.listen(
      {
        port: process.env.PORT,
      },
      resolve
    )
  );
  console.log(`SERVER ON PORT ${process.env.PORT}`);
}
