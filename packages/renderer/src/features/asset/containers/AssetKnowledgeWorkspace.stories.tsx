import { useMemo } from 'react'

import { QueryClient } from '@tanstack/react-query'
import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import { ApiRequestError, apiRouteContract } from '@/app/project-runtime'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'

import { AssetKnowledgeWorkspace } from './AssetKnowledgeWorkspace'
import { withAssetStoryShell } from './asset-storybook'
import { getAssetStorySearch } from '../components/asset-story-fixture'

const ASSET_NOT_FOUND_SEARCH = '?scope=asset&id=asset-missing&lens=knowledge&view=profile'
const ASSET_NOT_FOUND_API_MESSAGE = 'API boundary reported missing asset detail for asset-missing.'

function createStoryQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })
}

function AssetApiNotFoundStory() {
  if (typeof window !== 'undefined' && window.location.search !== ASSET_NOT_FOUND_SEARCH) {
    window.history.replaceState({}, '', `${window.location.pathname}${ASSET_NOT_FOUND_SEARCH}${window.location.hash}`)
  }

  const runtime = useMemo(
    () =>
      createFakeApiRuntime({
        overrides: [
          {
            method: 'GET',
            path: apiRouteContract.assetKnowledge({ projectId: 'project-smoke', assetId: 'asset-missing' }),
            error: new ApiRequestError({
              status: 404,
              message: ASSET_NOT_FOUND_API_MESSAGE,
              code: 'ASSET_NOT_FOUND',
            }),
          },
        ],
      }).runtime,
    [],
  )
  const queryClient = useMemo(() => createStoryQueryClient(), [])

  return (
    <AppProviders runtime={runtime} queryClient={queryClient}>
      <AssetKnowledgeWorkspace />
    </AppProviders>
  )
}

const meta = {
  title: 'Mockups/Asset/Knowledge Workspace',
  component: AssetKnowledgeWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withAssetStoryShell('ring-panel overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof AssetKnowledgeWorkspace>

export default meta

type Story = StoryObj<typeof meta>

export const CharacterProfile: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('character', 'profile'),
    },
  },
}

export const LocationMentions: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('location', 'mentions'),
    },
  },
}

export const RuleRelations: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('rule', 'relations'),
    },
  },
}

export const ContextPolicy: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('character', 'context'),
    },
  },
}

export const MissingPolicy: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('missing-policy', 'context'),
    },
  },
}

export const AssetNotFound: Story = {
  parameters: {
    assetStory: {
      search: ASSET_NOT_FOUND_SEARCH,
    },
  },
  render: () => <AssetApiNotFoundStory />,
}
