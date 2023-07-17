import { rule, shield } from 'graphql-shield'

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx) => {
    return ctx.user !== null
  },
)

const isAdmin = rule({ cache: 'contextual' })(async (parent, args, ctx) => {
  return ctx.user.role === 'admin'
})

const isEditor = rule({ cache: 'contextual' })(async (parent, args, ctx) => {
  return ctx.user.role === 'editor'
})

// Permissions

const permissions = shield({
  Query: {},
  Mutation: {
    favoriteToken: isAuthenticated,
  },
})

export default permissions
