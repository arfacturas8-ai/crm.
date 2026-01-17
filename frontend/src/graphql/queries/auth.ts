import { gql } from '@apollo/client';

// Login mutation
export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
      user {
        id
        name
        email
        role: roles {
          nodes {
            name
          }
        }
        avatar {
          url
        }
      }
    }
  }
`;

// Refresh token mutation
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(input: { refreshToken: $refreshToken }) {
      authToken
      refreshToken
    }
  }
`;

// Get current user query
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    viewer {
      id
      name
      email
      roles {
        nodes {
          name
        }
      }
      avatar {
        url
      }
    }
  }
`;

// Logout mutation (WordPress GraphQL with JWT)
export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

// Register mutation (if needed)
export const REGISTER = gql`
  mutation Register($input: RegisterUserInput!) {
    registerUser(input: $input) {
      user {
        id
        name
        email
      }
    }
  }
`;

// Reset password mutation
export const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!) {
    sendPasswordResetEmail(input: { email: $email }) {
      success
    }
  }
`;

// Set new password mutation
export const SET_NEW_PASSWORD = gql`
  mutation SetNewPassword($key: String!, $password: String!, $login: String!) {
    resetUserPassword(
      input: { key: $key, password: $password, login: $login }
    ) {
      user {
        id
        email
      }
    }
  }
`;
