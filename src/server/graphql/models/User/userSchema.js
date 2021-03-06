import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLInt,
  GraphQLInputObjectType
} from 'graphql';
import {GraphQLEmailType, GraphQLURLType} from '../../types';
import GraphQLISO8601Type from 'graphql-custom-datetype';
import TeamMember from '../TeamMember/teamMemberSchema';
import getRethink from 'server/database/rethinkDriver';
import {OrgUserRole} from 'server/graphql/models/Organization/organizationSchema';
import {BILLING_LEADER} from 'universal/utils/constants';

const IdentityType = new GraphQLObjectType({
  name: 'IdentityType',
  fields: () => ({
    connection: {
      type: GraphQLString,
      description: `The connection name.
      This field is not itself updateable
      but is needed when updating email, email_verified, username or password.`
    },
    userId: {
      type: GraphQLID,
      description: 'The unique identifier for the user for the identity.'
    },
    provider: {
      type: GraphQLString,
      description: 'The type of identity provider.'
    },
    isSocial: {
      type: GraphQLBoolean,
      description: 'true if the identity provider is a social provider, false otherwise'
    }
  })
});

const BlockedUserType = new GraphQLObjectType({
  name: 'BlockedUserType',
  description: 'Identifier and IP address blocked',
  fields: () => ({
    identifier: {
      type: GraphQLString,
      description: 'The identifier (usually email) of blocked user'
    },
    id: {
      type: GraphQLString,
      description: 'The IP address of the blocked user'
    }
  })
});

const UserOrg = new GraphQLObjectType({
  name: 'UserOrg',
  description: 'The user/org M:F join, denormalized on the user/org tables',
  fields: () => ({
    id: {
      type: GraphQLID,
      description: 'The orgId'
    },
    role: {
      type: OrgUserRole,
      description: 'role of the user in the org'
    }
  })
});


export const User = new GraphQLObjectType({
  name: 'User',
  description: 'The user account profile',
  fields: () => ({
    id: {
      type: GraphQLID,
      description: 'The userId provided by auth0'
    },
    blockedFor: {
      type: new GraphQLList(BlockedUserType),
      description: 'Array of identifier + ip pairs'
    },
    cachedAt: {
      type: GraphQLISO8601Type,
      description: 'The timestamp of the user was cached'
    },
    cacheExpiresAt: {
      type: GraphQLISO8601Type,
      description: 'The timestamp when the cached user expires'
    },
    createdAt: {
      type: GraphQLISO8601Type,
      description: 'The timestamp the user was created'
    },
    email: {
      type: new GraphQLNonNull(GraphQLEmailType),
      description: 'The user email'
    },
    emailVerified: {
      type: GraphQLBoolean,
      description: 'true if email is verified, false otherwise'
    },
    identities: {
      type: new GraphQLList(IdentityType),
      description: `An array of objects with information about the user's identities.
      More than one will exists in case accounts are linked`
    },
    loginsCount: {
      type: GraphQLInt,
      description: 'The number of logins for this user'
    },
    name: {
      type: GraphQLString,
      description: 'Name associated with the user'
    },
    nickname: {
      type: GraphQLString,
      description: 'Nickname associated with the user'
    },
    picture: {
      type: GraphQLURLType,
      description: 'url of user’s profile picture'
    },
    updatedAt: {
      type: GraphQLISO8601Type,
      description: 'The timestamp the user was last updated'
    },
    /* User Profile */
    broadcastFlags: {
      type: GraphQLInt,
      description: 'flag to determine which broadcasts to show'
    },
    lastSeenAt: {
      type: GraphQLISO8601Type,
      description: 'The last time the user connected via websocket'
    },
    inactive: {
      type: GraphQLBoolean,
      description: 'true if the user is not currently being billed for service. removed on every websocket handshake'
    },
    isBillingLeader: {
      type: GraphQLBoolean,
      description: 'true if the user is a part of the supplied orgId',
      resolve: (source, {orgId}) => {
        return Boolean(source.userOrgs.find((userOrg) => userOrg.id === orgId && userOrg.role === BILLING_LEADER));
      }
    },
    preferredName: {
      type: GraphQLString,
      description: 'The application-specific name, defaults to nickname'
    },
    tms: {
      type: new GraphQLList(GraphQLID),
      description: 'all the teams the user is a part of'
    },
    trialOrg: {
      type: GraphQLISO8601Type,
      description: 'The orgId that the user created for their free trial'
    },
    userOrgs: {
      type: new GraphQLList(UserOrg),
      description: 'the orgs and roles for this user on each'
    },
    welcomeSentAt: {
      type: GraphQLISO8601Type,
      description: 'The datetime that we sent them a welcome email'
    },
    /* GraphQL Sugar */
    memberships: {
      type: new GraphQLList(TeamMember),
      description: 'The memberships to different teams that the user has',
      resolve({id}) {
        const r = getRethink();
        return r.table('TeamMember')
          .getAll(id, {index: 'userId'})
          .run();
      }
    },
    jwt: {
      type: GraphQLID,
      description: 'a refreshed JWT'
    }
  })
});

export const UserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: () => ({
    id: {type: GraphQLID, description: 'The unique userId'},
    picture: {
      type: GraphQLURLType,
      description: 'A link to the user’s profile image.'
    },
    preferredName: {
      type: GraphQLString,
      description: 'The name, as confirmed by the user'
    }
  })
});
