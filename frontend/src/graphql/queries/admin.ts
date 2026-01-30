import { gql } from '@apollo/client';

// Get audit logs (admin only)
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs(
    $first: Int
    $offset: Int
    $entityType: String
    $action: String
    $userId: ID
    $startDate: String
    $endDate: String
  ) {
    auditLogs(
      first: $first
      offset: $offset
      entityType: $entityType
      action: $action
      userId: $userId
      startDate: $startDate
      endDate: $endDate
    ) {
      nodes {
        id
        userId
        userName
        action
        entityType
        entityId
        entityName
        oldValue
        newValue
        ipAddress
        userAgent
        createdAt
      }
      totalCount
    }
  }
`;

// Get deleted records (admin only)
export const GET_DELETED_RECORDS = gql`
  query GetDeletedRecords(
    $first: Int
    $offset: Int
    $entityType: String
  ) {
    deletedRecords(
      first: $first
      offset: $offset
      entityType: $entityType
    ) {
      nodes {
        id
        entityType
        entityId
        entityName
        deletedBy
        deletedByName
        deletedAt
        expiresAt
        daysRemaining
        canRecover
      }
      totalCount
    }
  }
`;

// Recover deleted record mutation
export const RECOVER_RECORD = gql`
  mutation RecoverRecord($input: RecoverRecordInput!) {
    recoverRecord(input: $input) {
      success
      message
      clientMutationId
    }
  }
`;

// Bulk delete mutation (generic)
export const BULK_DELETE = gql`
  mutation BulkDelete($input: BulkDeleteInput!) {
    bulkDelete(input: $input) {
      success
      deletedCount
      errors
      clientMutationId
    }
  }
`;
