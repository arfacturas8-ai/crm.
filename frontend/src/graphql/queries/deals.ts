import { gql } from '@apollo/client';

// Fragment for deal fields - matches server schema
export const DEAL_FRAGMENT = gql`
  fragment DealFields on Deal {
    id
    title
    leadId
    propertyId
    stage
    value
    createdAt
  }
`;

// Get all deals with pagination
export const GET_DEALS = gql`
  query GetDeals(
    $first: Int
    $offset: Int
    $stage: String
    $search: String
  ) {
    deals(
      first: $first
      offset: $offset
      stage: $stage
      search: $search
    ) {
      nodes {
        id
        title
        leadId
        propertyId
        stage
        value
        createdAt
      }
      totalCount
    }
  }
`;

// Get all deals for kanban board (filter by stage on client)
export const GET_DEALS_BY_STAGE = gql`
  query GetDealsByStage {
    deals(first: 100) {
      nodes {
        id
        title
        leadId
        propertyId
        stage
        value
        createdAt
      }
      totalCount
    }
  }
`;

// Get single deal by ID
export const GET_DEAL = gql`
  query GetDeal($id: ID!) {
    deal(id: $id) {
      id
      title
      leadId
      propertyId
      stage
      value
      createdAt
      notes
    }
  }
`;

// Create deal mutation
export const CREATE_DEAL = gql`
  mutation CreateDeal($input: CreateDealInput!) {
    createDeal(input: $input) {
      deal {
        id
        title
        leadId
        propertyId
        stage
        value
        createdAt
      }
      success
      clientMutationId
    }
  }
`;

// Update deal mutation
export const UPDATE_DEAL = gql`
  mutation UpdateDeal($input: UpdateDealInput!) {
    updateDeal(input: $input) {
      deal {
        id
        title
        leadId
        propertyId
        stage
        value
        createdAt
      }
      success
      clientMutationId
    }
  }
`;

// Delete deal mutation
export const DELETE_DEAL = gql`
  mutation DeleteDeal($input: DeleteDealInput!) {
    deleteDeal(input: $input) {
      success
      clientMutationId
    }
  }
`;
