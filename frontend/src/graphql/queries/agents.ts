import { gql } from '@apollo/client';

// Get all agents with meta fields
export const GET_AGENTS = gql`
  query GetAgents($first: Int) {
    agents(first: $first) {
      totalCount
      nodes {
        id
        databaseId
        title
        status
        content
        profileImageUrl
        agentMeta {
          email
          phone
          officePhone
          whatsapp
          position
          license
        }
      }
    }
  }
`;

// Alternative: Query using allAgent (WPGraphQL naming convention)
export const GET_ALL_AGENTS = gql`
  query GetAllAgents($first: Int) {
    allAgent(first: $first) {
      nodes {
        id
        databaseId
        title
        slug
        date
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

// Get single agent by ID
export const GET_AGENT = gql`
  query GetAgent($id: ID!) {
    agent(id: $id) {
      id
      databaseId
      title
      slug
      content
      date
      featuredImage {
        node {
          sourceUrl(size: MEDIUM)
        }
      }
    }
  }
`;

// Get agent's properties (listings) - query all properties and filter by agent relationship
export const GET_AGENT_PROPERTIES = gql`
  query GetAgentProperties($first: Int) {
    properties(first: $first) {
      nodes {
        id
        databaseId
        title
        status
        date
        propertyStatus
        propertyType
        propertyMeta {
          price
          bedrooms
          bathrooms
          propertySize
          address
          agent
        }
        featuredImage {
          node {
            sourceUrl(size: THUMBNAIL)
          }
        }
      }
    }
  }
`;

// Create agent mutation
export const CREATE_AGENT = gql`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      agent {
        id
        databaseId
        title
      }
    }
  }
`;

// Update agent mutation
export const UPDATE_AGENT = gql`
  mutation UpdateAgent($input: UpdateAgentInput!) {
    updateAgent(input: $input) {
      agent {
        id
        databaseId
        title
      }
    }
  }
`;

// Delete agent mutation
export const DELETE_AGENT = gql`
  mutation DeleteAgent($input: DeleteAgentInput!) {
    deleteAgent(input: $input) {
      deletedId
      agent {
        id
        title
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
