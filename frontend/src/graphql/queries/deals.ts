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
    visitaConfirmada
    calificacion
    proximoPaso
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
        propiedad
        estado
        detalles
        fecha1
        fecha2
        visitaConfirmada
        calificacion
        proximoPaso
        createdAt
        updatedAt
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        total
      }
    }
  }
`;

// Get deals by group for kanban board
export const GET_DEALS_BY_GROUP = gql`
  query GetDealsByGroup {
    activeDeals: deals(group: "active", first: 100) {
      nodes {
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
        calificacion
        proximoPaso
        createdAt
        updatedAt
      }
      totalCount
    }
    wonDeals: deals(group: "won", first: 100) {
      nodes {
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
        calificacion
        proximoPaso
        createdAt
        updatedAt
      }
      totalCount
    }
    lostDeals: deals(group: "lost", first: 100) {
      nodes {
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
        calificacion
        proximoPaso
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
      propiedad
      estado
      detalles
      fecha1
      fecha2
      visitaConfirmada
      calificacion
      proximoPaso
      createdAt
      updatedAt
      notes {
        id
        content
        authorId
        authorName
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
        propiedad
        estado
        detalles
        calificacion
        proximoPaso
        createdAt
        updatedAt
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
        visitaConfirmada
        calificacion
        proximoPaso
        createdAt
        updatedAt
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
