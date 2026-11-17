import { defineConfig } from 'orval'

/**
 * Generates the typed API client from the API's OpenAPI document: `pnpm generate:api`.
 *
 * The document is written by Debug builds of the API on the host (`dotnet build` in `server/`),
 * so regenerate after changing endpoints or DTOs and commit both files.
 */
export default defineConfig({
  prokatHub: {
    input: {
      target: '../server/ProkatHub.Api/openapi/prokat-hub.json',
    },
    output: {
      target: 'src/api/generated',
      schemas: 'src/api/generated/model',
      // One file of hooks per controller (auth, categories, items, rentals).
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      formatter: 'prettier',
      override: {
        // Every request goes through apiFetch: base URL, bearer token and errors in one place.
        mutator: {
          path: 'src/api/http-client.ts',
          name: 'apiFetch',
        },
        fetch: {
          // Hooks return the response body; failed requests throw ApiError instead.
          includeHttpResponseReturnType: false,
        },
        // GET endpoints become useQuery hooks, the others useMutation hooks.
        query: {
          signal: true,
        },
      },
    },
  },
})
