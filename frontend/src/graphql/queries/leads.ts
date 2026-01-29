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
    createdAt
    updatedAt
  }
`;

// Get all leads with pagination
export const GET_LEADS = gql`
  query GetLeads(
    $first: Int
    $offset: Int
    $status: String
    $source: String
    $search: String
  ) {
    leads(
      first: $first
      offset: $offset
      status: $status
      source: $source
      search: $search
    ) {
      nodes {
        id
        name
        email
        mobile
        source
        message
        status
        propertyId
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

// Get single lead by ID
export const GET_LEAD = gql`
  query GetLead($id: ID!) {
    lead(id: $id) {
      id
      name
      email
      mobile
      source
      message
      status
      propertyId
      createdAt
      updatedAt
      notes
    }
  }
`;

// Create lead mutation
export const CREATE_LEAD = gql`
  mutation CreateLead($input: CreateLeadInput!) {
    createLead(input: $input) {
      lead {
        id
        name
        email
        mobile
        source
        message
        status
        propertyId
        createdAt
        updatedAt
      }
      success
      clientMutationId
    }
  }
`;

// Update lead mutation
export const UPDATE_LEAD = gql`
  mutation UpdateLead($input: UpdateLeadInput!) {
    updateLead(input: $input) {
      lead {
        id
        name
        email
        mobile
        source
        message
        status
        propertyId
        createdAt
        updatedAt
      }
      success
      clientMutationId
    }
  }
`;

// Delete lead mutation
export const DELETE_LEAD = gql`
  mutation DeleteLead($input: DeleteLeadInput!) {
    deleteLead(input: $input) {
      success
      clientMutationId
    }
  }
`;
