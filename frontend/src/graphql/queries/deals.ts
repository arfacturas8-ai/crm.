import { gql } from '@apollo/client';

// Fragment for deal fields - matches server schema
export const DEAL_FRAGMENT = gql`
  fragment DealFields on Deal {
    id
    leadId
    leadName
    leadEmail
    leadMobile
    group
    busca
    estado
    calificacion
    proximoPaso
    propiedad
    propertyId
    detalles
    fecha1
    fecha2
    visitaConfirmada
    agentId
    agentName
    createdAt
    updatedAt
  }
`;

// Get all deals with pagination
export const GET_DEALS = gql`
  query GetDeals(
    $first: Int
    $offset: Int
    $group: String
    $estado: String
    $search: String
  ) {
    deals(
      first: $first
      offset: $offset
      group: $group
      estado: $estado
      search: $search
    ) {
      nodes {
        id
        leadId
        leadName
        leadEmail
        leadMobile
        group
        busca
        estado
        calificacion
        proximoPaso
        propiedad
        propertyId
        detalles
        agentId
        agentName
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

// Get all deals for kanban board (filter by stage on client)
export const GET_DEALS_BY_STAGE = gql`
  query GetDealsByStage($agentId: ID) {
    deals(first: 100, agentId: $agentId) {
      nodes {
        id
        leadId
        leadName
        leadEmail
        leadMobile
        group
        busca
        estado
        calificacion
        proximoPaso
        propiedad
        propertyId
        detalles
        agentId
        agentName
        createdAt
        updatedAt
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
      leadId
      leadName
      leadEmail
      leadMobile
      group
      busca
      estado
      calificacion
      proximoPaso
      propiedad
      propertyId
      detalles
      fecha1
      fecha2
      visitaConfirmada
      agentId
      agentName
      createdAt
      updatedAt
      notes {
        id
        content
        authorName
        createdAt
      }
    }
  }
`;

// Create deal mutation
export const CREATE_DEAL = gql`
  mutation CreateDeal($input: CreateDealInput!) {
    createDeal(input: $input) {
      deal {
        id
        leadId
        leadName
        leadEmail
        leadMobile
        group
        busca
        estado
        calificacion
        proximoPaso
        propiedad
        propertyId
        detalles
        agentId
        agentName
        createdAt
        updatedAt
      }
      success
      message
    }
  }
`;

// Update deal mutation
export const UPDATE_DEAL = gql`
  mutation UpdateDeal($input: UpdateDealInput!) {
    updateDeal(input: $input) {
      deal {
        id
        leadId
        leadName
        leadEmail
        leadMobile
        group
        busca
        estado
        calificacion
        proximoPaso
        propiedad
        propertyId
        detalles
        fecha1
        fecha2
        visitaConfirmada
        agentId
        agentName
        createdAt
        updatedAt
      }
      success
      message
    }
  }
`;

// Delete deal mutation
export const DELETE_DEAL = gql`
  mutation DeleteDeal($input: DeleteDealInput!) {
    deleteDeal(input: $input) {
      success
      message
    }
  }
`;
