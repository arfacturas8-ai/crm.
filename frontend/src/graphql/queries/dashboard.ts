import { gql } from '@apollo/client';

// Get CRM stats for dashboard
export const GET_CRM_STATS = gql`
  query GetCRMStats {
    crmStats {
      totalLeads
      totalDeals
      activeDeals
      wonDeals
      newLeadsThisMonth
      conversionRate
    }
  }
`;

// Get recent leads
export const GET_RECENT_LEADS = gql`
  query GetRecentLeads {
    leads(first: 5) {
      nodes {
        id
        name
        email
        mobile
        source
        status
        createdAt
      }
    }
  }
`;

// Get recent deals
export const GET_RECENT_DEALS = gql`
  query GetRecentDeals {
    deals(first: 5) {
      nodes {
        id
        leadName
        leadEmail
        group
        busca
        estado
        createdAt
      }
    }
  }
`;
