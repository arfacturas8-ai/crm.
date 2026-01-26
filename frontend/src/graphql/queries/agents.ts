import { gql } from '@apollo/client';

// Get all users (agents, moderators, admins)
export const GET_USERS = gql`
  query GetUsers($first: Int) {
    users(first: $first) {
      nodes {
        id
        databaseId
        name
        email
        roles {
          nodes {
            name
          }
        }
        avatar {
          url
        }
        registeredDate
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Get single user by ID
export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      databaseId
      name
      email
      firstName
      lastName
      roles {
        nodes {
          name
        }
      }
      avatar {
        url
      }
      registeredDate
      description
    }
  }
`;

// Get agent's properties (listings) from Houzez
export const GET_AGENT_PROPERTIES = gql`
  query GetAgentProperties($authorId: Int!, $first: Int) {
    properties(first: $first, where: { author: $authorId }) {
      nodes {
        id
        databaseId
        title
        status
        date
        propertyStatus {
          nodes {
            name
          }
        }
        propertyType {
          nodes {
            name
          }
        }
        propertyMeta {
          price
          priceLabel
          bedrooms
          bathrooms
          garages
          area
          areaUnit
        }
        featuredImage {
          node {
            sourceUrl(size: THUMBNAIL)
          }
        }
      }
      totalCount
    }
  }
`;

// Create user mutation (WordPress GraphQL mutation)
export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
        databaseId
        name
        email
        roles {
          nodes {
            name
          }
        }
      }
    }
  }
`;

// Update user mutation
export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      user {
        id
        databaseId
        name
        email
        firstName
        lastName
        roles {
          nodes {
            name
          }
        }
        description
      }
    }
  }
`;

// Delete user mutation
export const DELETE_USER = gql`
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input) {
      deletedId
      user {
        id
        name
      }
    }
  }
`;

// Update property status (approve/reject listing)
export const UPDATE_PROPERTY_STATUS = gql`
  mutation UpdateProperty($input: UpdatePropertyInput!) {
    updateProperty(input: $input) {
      property {
        id
        databaseId
        title
        status
      }
    }
  }
`;

// Delete property
export const DELETE_PROPERTY = gql`
  mutation DeleteProperty($input: DeletePropertyInput!) {
    deleteProperty(input: $input) {
      deletedId
      property {
        id
        title
      }
    }
  }
`;

// Get agent stats (leads and deals assigned)
export const GET_AGENT_STATS = gql`
  query GetAgentStats($agentId: String!) {
    leads(where: { agentId: $agentId }) {
      totalCount
    }
    deals(where: { agentId: $agentId }) {
      totalCount
    }
  }
`;
