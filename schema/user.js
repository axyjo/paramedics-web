const userSchema = `
  extend type Query {
    user(id: Int!): User
    users: [User]
  }
  
  extend type Mutation {
    addUser(firstName: String!, lastName: String!, email: String!,  password: String!): User!
  }
  
  type User {
    accessLevel: String
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    emergencyContact: String
  }
  `
;

exports.userSchema = userSchema;
