import { gql } from '@apollo/client';

// Fragment for deal fields
export const DEAL_FRAGMENT = gql`
  fragment DealFields on Deal {
    id
    leadId
    leadName
    leadEmail
    leadMobile
    group
    busca
    propiedad
    estado
    detalles
    fecha1
    fecha2
    seguimiento
    visitaConfirmada
    calificacion
    proximoPaso
    agentId
    agentName
    createdAt
    updatedAt
  }
`;

// Get all deals with pagination
export const GET_DEALS = gql`
  ${DEAL_FRAGMENT}
  query GetDeals(
    $first: Int
    $after: String
    $group: String
    $agentId: String
    $search: String
  ) {
    deals(
      first: $first
      after: $after
      where: {
        group: $group
        agentId: $agentId
        search: $search
      }
    ) {
      nodes {
        ...DealFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

// Get deals by group for kanban board
export const GET_DEALS_BY_GROUP = gql`
  ${DEAL_FRAGMENT}
  query GetDealsByGroup($agentId: String) {
    activeDeals: deals(where: { group: "active", agentId: $agentId }) {
      nodes {
        ...DealFields
      }
      totalCount
    }
    wonDeals: deals(where: { group: "won", agentId: $agentId }) {
      nodes {
        ...DealFields
      }
      totalCount
    }
    lostDeals: deals(where: { group: "lost", agentId: $agentId }) {
      nodes {
        ...DealFields
      }
      totalCount
    }
  }
`;

// Get single deal by ID
export const GET_DEAL = gql`
  ${DEAL_FRAGMENT}
  query GetDeal($id: ID!) {
    deal(id: $id) {
      ...DealFields
      lead {
        id
        name
        email
        mobile
        source
      }
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
    }
  }
`;

// Create deal mutation
export const CREATE_DEAL = gql`
  ${DEAL_FRAGMENT}
  mutation CreateDeal($input: CreateDealInput!) {
    createDeal(input: $input) {
      ...DealFields
    }
  }
`;

// Update deal mutation
export const UPDATE_DEAL = gql`
  ${DEAL_FRAGMENT}
  mutation UpdateDeal($id: ID!, $input: UpdateDealInput!) {
    updateDeal(id: $id, input: $input) {
      ...DealFields
    }
  }
`;

// Move deal to different group
export const MOVE_DEAL = gql`
  ${DEAL_FRAGMENT}
  mutation MoveDeal($id: ID!, $group: String!) {
    moveDeal(id: $id, group: $group) {
      ...DealFields
    }
  }
`;

// Delete deal mutation
export const DELETE_DEAL = gql`
  mutation DeleteDeal($id: ID!) {
    deleteDeal(id: $id) {
      success
      message
    }
  }
`;
