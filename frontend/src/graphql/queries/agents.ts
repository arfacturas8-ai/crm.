import { gql } from '@apollo/client';

// Get all Houzez agents (custom post type)
export const GET_AGENTS = gql`
  query GetAgents($first: Int) {
    houzezAgents(first: $first) {
      nodes {
        id
        databaseId
        title
        slug
        date
        agentMeta {
          email
          mobile
          phone
          whatsapp
          position
          licenseNumber
          companyName
          serviceAreas
          specialties
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

// Alternative query if houzezAgents doesn't work - try agents
export const GET_AGENTS_ALT = gql`
  query GetAgentsAlt($first: Int) {
    agents(first: $first) {
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
    houzezAgent(id: $id) {
      id
      databaseId
      title
      slug
      content
      date
      agentMeta {
        email
        mobile
        phone
        whatsapp
        position
        licenseNumber
        companyName
        serviceAreas
        specialties
        facebook
        twitter
        linkedin
        instagram
      }
      featuredImage {
        node {
          sourceUrl(size: MEDIUM)
        }
      }
    }
  }
`;

// Get agent's properties (listings) from Houzez
export const GET_AGENT_PROPERTIES = gql`
  query GetAgentProperties($agentId: Int!, $first: Int) {
    properties(first: $first, where: { author: $agentId }) {
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

// Create agent mutation
export const CREATE_AGENT = gql`
  mutation CreateAgent($input: CreateHouzezAgentInput!) {
    createHouzezAgent(input: $input) {
      houzezAgent {
        id
        databaseId
        title
      }
    }
  }
`;

// Update agent mutation
export const UPDATE_AGENT = gql`
  mutation UpdateAgent($input: UpdateHouzezAgentInput!) {
    updateHouzezAgent(input: $input) {
      houzezAgent {
        id
        databaseId
        title
        agentMeta {
          email
          mobile
          phone
          position
        }
      }
    }
  }
`;

// Delete agent mutation
export const DELETE_AGENT = gql`
  mutation DeleteAgent($input: DeleteHouzezAgentInput!) {
    deleteHouzezAgent(input: $input) {
      deletedId
      houzezAgent {
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
