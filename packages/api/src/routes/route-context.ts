import type { FastifyInstance } from 'fastify'

import type { FixtureRepository } from '../repositories/fixtureRepository.js'

export interface ApiRouteContext {
  app: FastifyInstance
  apiBasePath: string
  repository: FixtureRepository
}
