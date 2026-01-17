import { gql } from '@apollo/client';

// Fragment for enquiry fields
export const ENQUIRY_FRAGMENT = gql`
  fragment EnquiryFields on Enquiry {
    id
    leadId
    leadName
    searchCriteria {
      propertyType
      location
      minPrice
      maxPrice
      bedrooms
      bathrooms
    }
    notes
    status
    createdAt
    updatedAt
  }
`;

// Get all enquiries with pagination
export const GET_ENQUIRIES = gql`
  ${ENQUIRY_FRAGMENT}
  query GetEnquiries(
    $first: Int
    $after: String
    $status: String
    $search: String
  ) {
    enquiries(
      first: $first
      after: $after
      where: {
        status: $status
        search: $search
      }
    ) {
      nodes {
        ...EnquiryFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

// Get single enquiry by ID
export const GET_ENQUIRY = gql`
  ${ENQUIRY_FRAGMENT}
  query GetEnquiry($id: ID!) {
    enquiry(id: $id) {
      ...EnquiryFields
      lead {
        id
        name
        email
        mobile
        source
      }
      matchedProperties {
        id
        title
        price
        location
        bedrooms
        bathrooms
        image
      }
    }
  }
`;

// Create enquiry mutation
export const CREATE_ENQUIRY = gql`
  ${ENQUIRY_FRAGMENT}
  mutation CreateEnquiry($input: CreateEnquiryInput!) {
    createEnquiry(input: $input) {
      ...EnquiryFields
    }
  }
`;

// Update enquiry mutation
export const UPDATE_ENQUIRY = gql`
  ${ENQUIRY_FRAGMENT}
  mutation UpdateEnquiry($id: ID!, $input: UpdateEnquiryInput!) {
    updateEnquiry(id: $id, input: $input) {
      ...EnquiryFields
    }
  }
`;

// Delete enquiry mutation
export const DELETE_ENQUIRY = gql`
  mutation DeleteEnquiry($id: ID!) {
    deleteEnquiry(id: $id) {
      success
      message
    }
  }
`;
