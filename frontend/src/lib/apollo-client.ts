import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost/graphql',
});

// Auth link to add token to requests
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage (client-side only)
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          leads: {
            keyArgs: ['status', 'source'],
            merge(existing, incoming, { args }) {
              if (!args?.after) {
                return incoming;
              }
              return {
                ...incoming,
                nodes: [...(existing?.nodes || []), ...incoming.nodes],
              };
            },
          },
          deals: {
            keyArgs: ['group'],
            merge(existing, incoming, { args }) {
              if (!args?.after) {
                return incoming;
              }
              return {
                ...incoming,
                nodes: [...(existing?.nodes || []), ...incoming.nodes],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default apolloClient;
