import { gql } from '@apollo/client';

// Fragment for lead fields
export const LEAD_FRAGMENT = gql`
  fragment LeadFields on Lead {
    id
    name
    email
    mobile
    source
    message
    status
    propertyId
    propertyTitle
    agentId
    agentName
    createdAt
    updatedAt
  }
`;

// Get all leads with pagination
export const GET_LEADS = gql`
  ${LEAD_FRAGMENT}
  query GetLeads(
    $first: Int
    $after: String
    $status: String
    $source: String
    $search: String
    $agentId: String
  ) {
    leads(
      first: $first
      after: $after
      where: {
        status: $status
        source: $source
        search: $search
        agentId: $agentId
      }
    ) {
      nodes {
        ...LeadFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

// Get single lead by ID
export const GET_LEAD = gql`
  ${LEAD_FRAGMENT}
  query GetLead($id: ID!) {
    lead(id: $id) {
      ...LeadFields
      notes {
        id
        content
        userId
        userName
        createdAt
      }
      activities {
        id
        type
        description
        userId
        userName
        createdAt
      }
      deals {
        id
        group
        busca
        propiedad
        estado
        createdAt
      }
    }
  }
`;

// Get leads count by source
export const GET_LEADS_BY_SOURCE = gql`
  query GetLeadsBySource {
    leadsBySource {
      source
      count
    }
  }
`;

// Create lead mutation
export const CREATE_LEAD = gql`
  ${LEAD_FRAGMENT}
  mutation CreateLead($input: CreateLeadInput!) {
    createLead(input: $input) {
      ...LeadFields
    }
  }
`;

// Update lead mutation
export const UPDATE_LEAD = gql`
  ${LEAD_FRAGMENT}
  mutation UpdateLead($id: ID!, $input: UpdateLeadInput!) {
    updateLead(id: $id, input: $input) {
      ...LeadFields
    }
  }
`;

// Delete lead mutation
export const DELETE_LEAD = gql`
  mutation DeleteLead($id: ID!) {
    deleteLead(id: $id) {
      success
      message
    }
  }
`;

// Import leads mutation
export const IMPORT_LEADS = gql`
  mutation ImportLeads($leads: [LeadImportInput!]!) {
    importLeads(leads: $leads) {
      imported
      skipped
      errors {
        row
        message
      }
    }
  }
`;
