'use strict';

const { ApolloServer } = require('apollo-server');
const { schema } = require('./graphql');

const server = new ApolloServer({ schema });

// server.listen().then(({ url }) => {
//   console.log(`🚀 Server ready at ${url}`);
// });

exports.server = server;